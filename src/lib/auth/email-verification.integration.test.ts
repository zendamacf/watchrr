import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { email_verification_tokens, users } from '@/lib/db/schema';
import { seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';
import {
  consumeVerificationToken,
  createVerificationToken,
  VERIFICATION_RESEND_COOLDOWN_MS,
  VERIFICATION_TOKEN_TTL_MINUTES,
} from './email-verification';
import { hashToken } from './token';

const EMAIL = 'vitest-email-verification@example.com';

describe('email verification tokens', () => {
  let userId: string;

  beforeAll(async () => {
    userId = (await seedUser({ email: EMAIL, password: seedPassword })).id;
  });

  beforeEach(async () => {
    await db.delete(email_verification_tokens).where(eq(email_verification_tokens.user_id, userId));
    await db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, userId));
  });

  async function verifiedAt() {
    const [row] = await db.select().from(users).where(eq(users.id, userId));
    return row?.emailVerifiedAt;
  }

  it('returns null for unknown and already-verified emails', async () => {
    expect(await createVerificationToken('nobody-here@example.com')).toBeNull();
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
    expect(await createVerificationToken(EMAIL)).toBeNull();
  });

  it('stores only a hash of the token, expiring in the configured window', async () => {
    const now = new Date('2030-01-01T00:00:00Z');
    const token = (await createVerificationToken(EMAIL.toUpperCase(), now)) as string;
    expect(token).toBeTruthy();

    const rows = await db.select().from(email_verification_tokens).where(eq(email_verification_tokens.user_id, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.token_hash).toBe(hashToken(token));
    expect(rows[0]?.token_hash).not.toBe(token);
    expect(rows[0]?.expires_at.getTime()).toBe(now.getTime() + VERIFICATION_TOKEN_TTL_MINUTES * 60_000);
  });

  it('enforces a resend cooldown, then replaces the older token', async () => {
    const t0 = new Date();
    const first = (await createVerificationToken(EMAIL, t0)) as string;
    expect(first).toBeTruthy();
    expect(await createVerificationToken(EMAIL, new Date(t0.getTime() + 1000))).toBeNull();

    const second = (await createVerificationToken(
      EMAIL,
      new Date(t0.getTime() + VERIFICATION_RESEND_COOLDOWN_MS + 1000),
    )) as string;
    expect(second).toBeTruthy();
    expect(await consumeVerificationToken(first)).toBe(false);
    expect(await verifiedAt()).toBeNull();
    expect(await consumeVerificationToken(second)).toBe(true);
  });

  it('verifies the account and cannot be reused', async () => {
    const token = (await createVerificationToken(EMAIL)) as string;
    const now = new Date();
    expect(await consumeVerificationToken(token, now)).toBe(true);
    expect((await verifiedAt())?.getTime()).toBe(now.getTime());
    expect(await consumeVerificationToken(token)).toBe(false);
  });

  it('rejects expired and unknown tokens', async () => {
    const now = new Date('2030-01-01T00:00:00Z');
    const token = (await createVerificationToken(EMAIL, now)) as string;
    const later = new Date(now.getTime() + (VERIFICATION_TOKEN_TTL_MINUTES + 1) * 60_000);

    expect(await consumeVerificationToken(token, later)).toBe(false);
    expect(await consumeVerificationToken('not-a-real-token')).toBe(false);
    expect(await verifiedAt()).toBeNull();
  });

  it('only one of two concurrent attempts succeeds', async () => {
    const token = (await createVerificationToken(EMAIL)) as string;
    const results = await Promise.all([consumeVerificationToken(token), consumeVerificationToken(token)]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });
});
