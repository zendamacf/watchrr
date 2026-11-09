import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { signAccessToken } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';
import { changePassword } from './password-change';
import { isTokenVersionCurrent, resetTokenVersionCacheForTests, TOKEN_VERSION_CACHE_TTL_MS } from './token-version';

const mockHeaders = vi.fn();
vi.mock('next/headers', () => ({ headers: () => mockHeaders() }));

import { guardUser } from '@/utils/auth';

async function bearer(userId: string, tv: number) {
  return new Headers({ authorization: `Bearer ${await signAccessToken(userId, tv)}` });
}

describe('password change invalidates sessions', () => {
  let userId: string;

  beforeAll(async () => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
    // Dedicated user: this test mutates the password and token version.
    const user = await seedUser({ email: 'vitest-password-change@example.com', password: seedPassword });
    userId = user.id;
  });

  beforeEach(async () => {
    resetTokenVersionCacheForTests();
    mockHeaders.mockReset();
    await db.update(users).set({ tokenVersion: 0 }).where(eq(users.id, userId));
  });

  it('accepts a session with the current version', async () => {
    mockHeaders.mockResolvedValue(await bearer(userId, 0));
    await expect(guardUser()).resolves.toEqual({ id: userId });
  });

  it('rejects the old session after a password change and accepts a new one', async () => {
    const oldHeaders = await bearer(userId, 0);

    const newVersion = await changePassword(userId, await hashPassword('new-password'));
    expect(newVersion).toBe(1);

    mockHeaders.mockResolvedValue(oldHeaders);
    await expect(guardUser()).resolves.toBeNull();

    mockHeaders.mockResolvedValue(await bearer(userId, 1));
    await expect(guardUser()).resolves.toEqual({ id: userId });

    const [row] = await db.select().from(users).where(eq(users.id, userId));
    expect(await verifyPassword('new-password', row?.passwordHash ?? '')).toBe(true);
  });

  it('clears the cache on change so revocation is immediate', async () => {
    expect(await isTokenVersionCurrent(userId, 0)).toBe(true); // primes cache
    await changePassword(userId, await hashPassword('another-password'));
    expect(await isTokenVersionCurrent(userId, 0)).toBe(false);
  });

  it('serves from cache within the TTL and refreshes after it', async () => {
    const t0 = 1_000_000;
    expect(await isTokenVersionCurrent(userId, 0, t0)).toBe(true);
    // Change behind the cache's back (no invalidation), as another instance would.
    await db.update(users).set({ tokenVersion: 5 }).where(eq(users.id, userId));
    expect(await isTokenVersionCurrent(userId, 0, t0 + TOKEN_VERSION_CACHE_TTL_MS - 1)).toBe(true);
    expect(await isTokenVersionCurrent(userId, 0, t0 + TOKEN_VERSION_CACHE_TTL_MS + 1)).toBe(false);
  });

  it('rejects tokens for unknown users', async () => {
    expect(await isTokenVersionCurrent('00000000-0000-4000-8000-000000000000', 0)).toBe(false);
  });

  it('returns null when changing the password of a missing user', async () => {
    await expect(changePassword('00000000-0000-4000-8000-000000000000', 'x')).resolves.toBeNull();
  });
});
