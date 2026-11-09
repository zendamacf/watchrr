import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { verifyPassword } from '@/lib/auth/password';
import { createResetToken } from '@/lib/auth/password-reset';
import { db } from '@/lib/db';
import { password_reset_tokens, users } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';
import { POST } from './route';

const EMAIL = 'vitest-reset-route@example.com';

function req(body: unknown) {
  return new Request(`http://localhost${apiRoutes.auth.resetPassword}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/auth/reset-password', () => {
  let userId: string;

  beforeAll(async () => {
    userId = (await seedUser({ email: EMAIL, password: seedPassword })).id;
  });

  beforeEach(async () => {
    await db.delete(password_reset_tokens).where(eq(password_reset_tokens.user_id, userId));
  });

  it('400s on invalid input', async () => {
    expect((await POST(req('nope'))).status).toBe(400);
    expect((await POST(req({ token: 'a' }))).status).toBe(400);
    expect((await POST(req({ token: '', password: 'x' }))).status).toBe(400);
  });

  it('rejects an unknown token', async () => {
    const response = await POST(req({ token: 'bogus', password: 'new-password-1' }));
    expect(response.status).toBe(400);
  });

  it('resets the password with a valid token, without setting a session cookie, and only once', async () => {
    const token = (await createResetToken(EMAIL)) as string;

    const ok = await POST(req({ token, password: 'route-new-password' }));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('Set-Cookie')).toBeNull();

    const [row] = await db.select().from(users).where(eq(users.id, userId));
    expect(await verifyPassword('route-new-password', row?.passwordHash ?? '')).toBe(true);

    expect((await POST(req({ token, password: 'second-try-password' }))).status).toBe(400);
  });
});
