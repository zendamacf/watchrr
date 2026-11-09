import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { invalidateTokenVersionCache } from './token-version';

/**
 * Sets a new password hash and bumps the token version in one statement, which invalidates
 * every existing session (JWT) for the user. Shared by reset-password and any future
 * change-password endpoint. Returns the new token version, or null if the user doesn't exist.
 */
export async function changePassword(userId: string, passwordHash: string): Promise<number | null> {
  const [row] = await db
    .update(users)
    .set({ passwordHash, tokenVersion: sql`${users.tokenVersion} + 1` })
    .where(eq(users.id, userId))
    .returning({ tokenVersion: users.tokenVersion });

  invalidateTokenVersionCache(userId);
  return row?.tokenVersion ?? null;
}
