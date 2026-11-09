import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { email_verification_tokens, lower, users } from '@/lib/db/schema';
import { generateToken, hashToken } from './token';

export const VERIFICATION_TOKEN_TTL_MINUTES = 24 * 60;
/** Minimum gap between verification emails for one account (limits email flooding). */
export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

/** Issues a fresh verification token for this user, replacing any unused ones. */
export async function issueVerificationToken(userId: string, now = new Date()): Promise<string> {
  const token = generateToken();
  await db.transaction(async (tx) => {
    await tx
      .delete(email_verification_tokens)
      .where(and(eq(email_verification_tokens.user_id, userId), isNull(email_verification_tokens.used_at)));
    await tx.insert(email_verification_tokens).values({
      user_id: userId,
      token_hash: hashToken(token),
      created_at: now,
      expires_at: new Date(now.getTime() + VERIFICATION_TOKEN_TTL_MINUTES * 60_000),
    });
  });
  return token;
}

/**
 * Creates a fresh verification token for the unverified account with this email, replacing any
 * unused ones. Returns null (without distinguishing why) for unknown or already-verified emails
 * or requests inside the cooldown.
 */
export async function createVerificationToken(email: string, now = new Date()): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(lower(users.email), email.trim().toLowerCase()))
    .limit(1);
  if (!user || user.emailVerifiedAt) return null;

  const unused = await db
    .select({ createdAt: email_verification_tokens.created_at })
    .from(email_verification_tokens)
    .where(and(eq(email_verification_tokens.user_id, user.id), isNull(email_verification_tokens.used_at)));
  const mostRecent = Math.max(0, ...unused.map((r) => r.createdAt.getTime()));
  if (now.getTime() - mostRecent < VERIFICATION_RESEND_COOLDOWN_MS) return null;

  return issueVerificationToken(user.id, now);
}

/**
 * Atomically claims the token (single-use, unexpired) and marks the account verified.
 * Returns false for unknown, expired or already-used tokens.
 */
export async function consumeVerificationToken(token: string, now = new Date()): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(email_verification_tokens)
      .set({ used_at: now })
      .where(
        and(
          eq(email_verification_tokens.token_hash, hashToken(token)),
          isNull(email_verification_tokens.used_at),
          gt(email_verification_tokens.expires_at, now),
        ),
      )
      .returning({ userId: email_verification_tokens.user_id });
    if (!claimed) return false;

    await tx
      .update(users)
      .set({ emailVerifiedAt: now })
      .where(and(eq(users.id, claimed.userId), isNull(users.emailVerifiedAt)));
    await tx
      .update(email_verification_tokens)
      .set({ used_at: now })
      .where(and(eq(email_verification_tokens.user_id, claimed.userId), isNull(email_verification_tokens.used_at)));
    return true;
  });
}
