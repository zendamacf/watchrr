import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { lower, password_reset_tokens, users } from '@/lib/db/schema';
import { hashPassword } from './password';
import { changePassword } from './password-change';
import { generateToken, hashToken } from './token';
import { invalidateTokenVersionCache } from './token-version';

export const RESET_TOKEN_TTL_MINUTES = 60;
/** Minimum gap between reset emails for one account (limits email flooding of a victim). */
export const RESET_REQUEST_COOLDOWN_MS = 60_000;

export const hashResetToken = hashToken;

/**
 * Creates a fresh reset token for the account with this email, replacing any unused ones.
 * Returns null (without distinguishing why) for unknown or unverified emails, or requests inside the cooldown.
 */
export async function createResetToken(email: string, now = new Date()): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(lower(users.email), email.trim().toLowerCase()))
    .limit(1);
  // Unverified addresses never get reset email (the caller can't tell why).
  if (!user?.emailVerifiedAt) return null;

  const unused = await db
    .select({ createdAt: password_reset_tokens.created_at })
    .from(password_reset_tokens)
    .where(and(eq(password_reset_tokens.user_id, user.id), isNull(password_reset_tokens.used_at)));
  const mostRecent = Math.max(0, ...unused.map((r) => r.createdAt.getTime()));
  if (now.getTime() - mostRecent < RESET_REQUEST_COOLDOWN_MS) return null;

  const token = generateToken();
  await db.transaction(async (tx) => {
    await tx
      .delete(password_reset_tokens)
      .where(and(eq(password_reset_tokens.user_id, user.id), isNull(password_reset_tokens.used_at)));
    await tx.insert(password_reset_tokens).values({
      user_id: user.id,
      token_hash: hashResetToken(token),
      created_at: now,
      expires_at: new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60_000),
    });
  });
  return token;
}

/**
 * Atomically claims the token (single-use, unexpired), sets the new password, and invalidates
 * every existing session. Returns false for unknown, expired or already-used tokens.
 */
export async function consumeResetToken(token: string, newPassword: string, now = new Date()): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);

  const userId = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(password_reset_tokens)
      .set({ used_at: now })
      .where(
        and(
          eq(password_reset_tokens.token_hash, hashResetToken(token)),
          isNull(password_reset_tokens.used_at),
          gt(password_reset_tokens.expires_at, now),
        ),
      )
      .returning({ userId: password_reset_tokens.user_id });
    if (!claimed) return null;

    await changePassword(claimed.userId, passwordHash, tx);
    // Any other outstanding links for this account die with this one.
    await tx
      .update(password_reset_tokens)
      .set({ used_at: now })
      .where(and(eq(password_reset_tokens.user_id, claimed.userId), isNull(password_reset_tokens.used_at)));
    return claimed.userId;
  });

  if (!userId) return false;
  invalidateTokenVersionCache(userId);
  return true;
}
