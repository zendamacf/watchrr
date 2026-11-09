import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

/**
 * Short TTL keeps the per-request cost to (at most) one primary-key lookup per user per window.
 * In a single instance, password changes clear the entry immediately; with several instances a
 * revoked session can survive at most this long on the others.
 */
export const TOKEN_VERSION_CACHE_TTL_MS = 30_000;

const cache = new Map<string, { version: number | null; expiresAt: number }>();

async function loadTokenVersion(userId: string, now: number): Promise<number | null> {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > now) return cached.version;

  const [row] = await db.select({ version: users.tokenVersion }).from(users).where(eq(users.id, userId)).limit(1);
  const version = row?.version ?? null;
  cache.set(userId, { version, expiresAt: now + TOKEN_VERSION_CACHE_TTL_MS });
  return version;
}

/** True when the user exists and the token's version matches their current one. */
export async function isTokenVersionCurrent(userId: string, tokenVersion: number, now = Date.now()): Promise<boolean> {
  const current = await loadTokenVersion(userId, now);
  return current !== null && current === tokenVersion;
}

export function invalidateTokenVersionCache(userId: string): void {
  cache.delete(userId);
}

/** @internal Vitest only. */
export function resetTokenVersionCacheForTests(): void {
  cache.clear();
}
