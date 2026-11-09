import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createVerificationToken } from '@/lib/auth/email-verification';
import { db } from '@/lib/db';
import { email_verification_tokens, users } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';
import { POST } from './route';

const EMAIL = 'vitest-verify-email-route@example.com';

function req(body: unknown) {
  return new Request(`http://localhost${apiRoutes.auth.verifyEmail}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/auth/verify-email', () => {
  let userId: string;

  beforeAll(async () => {
    userId = (await seedUser({ email: EMAIL, password: seedPassword })).id;
  });

  beforeEach(async () => {
    await db.delete(email_verification_tokens).where(eq(email_verification_tokens.user_id, userId));
    await db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, userId));
  });

  it('400s on invalid input', async () => {
    expect((await POST(req('not json'))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ token: '' }))).status).toBe(400);
  });

  it('verifies the account once, then rejects reuse', async () => {
    const token = (await createVerificationToken(EMAIL)) as string;
    const first = await POST(req({ token }));
    expect(first.status).toBe(200);
    expect(first.headers.get('Set-Cookie')).toBeNull();
    const [row] = await db.select().from(users).where(eq(users.id, userId));
    expect(row?.emailVerifiedAt).toBeInstanceOf(Date);

    expect((await POST(req({ token }))).status).toBe(400);
  });

  it('400s for an unknown token', async () => {
    const response = await POST(req({ token: 'nope' }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'This verification link is invalid or has expired' });
  });
});
