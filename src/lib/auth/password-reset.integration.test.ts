import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { verifyPassword } from '@/lib/auth/password';
import { db } from '@/lib/db';
import { password_reset_tokens, users } from '@/lib/db/schema';
import { seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';
import {
  consumeResetToken,
  createResetToken,
  hashResetToken,
  RESET_REQUEST_COOLDOWN_MS,
  RESET_TOKEN_TTL_MINUTES,
} from './password-reset';
import { resetTokenVersionCacheForTests } from './token-version';

const EMAIL = 'vitest-password-reset@example.com';

describe('password reset tokens', () => {
  let userId: string;

  beforeAll(async () => {
    // Dedicated user: these tests change the password and token version.
    userId = (await seedUser({ email: EMAIL, password: seedPassword })).id;
  });

  beforeEach(async () => {
    resetTokenVersionCacheForTests();
    await db.delete(password_reset_tokens).where(eq(password_reset_tokens.user_id, userId));
    await db.update(users).set({ tokenVersion: 0 }).where(eq(users.id, userId));
  });

  it('returns null for an unknown email', async () => {
    expect(await createResetToken('nobody-here@example.com')).toBeNull();
  });

  it('stores only a hash of the token, expiring in the configured window', async () => {
    const now = new Date('2030-01-01T00:00:00Z');
    const token = await createResetToken(EMAIL.toUpperCase(), now);
    expect(token).toBeTruthy();

    const rows = await db.select().from(password_reset_tokens).where(eq(password_reset_tokens.user_id, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.token_hash).toBe(hashResetToken(token as string));
    expect(rows[0]?.token_hash).not.toBe(token);
    expect(rows[0]?.expires_at.getTime()).toBe(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60_000);
  });

  it('enforces a cooldown between requests, then replaces the older token', async () => {
    const t0 = new Date();
    const first = await createResetToken(EMAIL, t0);
    expect(first).toBeTruthy();
    expect(await createResetToken(EMAIL, new Date(t0.getTime() + 1000))).toBeNull();

    const second = await createResetToken(EMAIL, new Date(t0.getTime() + RESET_REQUEST_COOLDOWN_MS + 1000));
    expect(second).toBeTruthy();
    expect(await consumeResetToken(first as string, 'x-first-password')).toBe(false);
    expect(await consumeResetToken(second as string, 'x-second-password')).toBe(true);
  });

  it('sets the new password, invalidates sessions, and cannot be reused', async () => {
    const token = (await createResetToken(EMAIL)) as string;

    expect(await consumeResetToken(token, 'brand-new-password')).toBe(true);

    const [row] = await db.select().from(users).where(eq(users.id, userId));
    expect(await verifyPassword('brand-new-password', row?.passwordHash ?? '')).toBe(true);
    expect(row?.tokenVersion).toBe(1);

    expect(await consumeResetToken(token, 'another-password')).toBe(false);
    const [after] = await db.select().from(users).where(eq(users.id, userId));
    expect(await verifyPassword('brand-new-password', after?.passwordHash ?? '')).toBe(true);
    expect(after?.tokenVersion).toBe(1);
  });

  it('rejects expired and unknown tokens without changing the password', async () => {
    const now = new Date('2030-01-01T00:00:00Z');
    const token = (await createResetToken(EMAIL, now)) as string;
    const later = new Date(now.getTime() + (RESET_TOKEN_TTL_MINUTES + 1) * 60_000);

    expect(await consumeResetToken(token, 'expired-attempt', later)).toBe(false);
    expect(await consumeResetToken('not-a-real-token', 'unknown-attempt')).toBe(false);

    const [row] = await db.select().from(users).where(eq(users.id, userId));
    expect(row?.tokenVersion).toBe(0);
  });

  it('only one of two concurrent attempts succeeds', async () => {
    const token = (await createResetToken(EMAIL)) as string;
    const results = await Promise.all([
      consumeResetToken(token, 'race-password-a'),
      consumeResetToken(token, 'race-password-b'),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    const [row] = await db.select().from(users).where(eq(users.id, userId));
    expect(row?.tokenVersion).toBe(1);
  });
});
