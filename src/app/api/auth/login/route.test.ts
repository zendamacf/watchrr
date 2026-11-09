import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';
import { POST } from './route';

function loginRequest(body: unknown) {
  return new Request(`http://localhost${apiRoutes.auth.login}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
    vi.stubEnv('RESEND_API_KEY', '');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('returns 400 for invalid JSON', async () => {
    const response = await POST(
      new Request(`http://localhost${apiRoutes.auth.login}`, {
        method: 'POST',
        body: 'not json',
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid request body' });
  });

  it('returns 400 when email or password is missing', async () => {
    const response = await POST(loginRequest({ email: 'a@b.com' }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Email and password are required' });
  });

  it('returns 400 when email or password is empty after trim', async () => {
    const response = await POST(loginRequest({ email: '  ', password: 'x' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when user is not found', async () => {
    const response = await POST(loginRequest({ email: 'nobody@example.com', password: 'secret' }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid email or password' });
  });

  it('returns 401 when password does not match', async () => {
    await seedUser({ email: seedEmails.loginWrongPassword, password: seedPassword });
    const response = await POST(loginRequest({ email: seedEmails.loginWrongPassword, password: 'wrong' }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid email or password' });
  });

  it('returns 200 with token and Set-Cookie on success', async () => {
    await seedUser({ email: seedEmails.loginSuccess, password: seedPassword });
    const response = await POST(loginRequest({ email: `  ${seedEmails.loginSuccess}  `, password: seedPassword }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');
  });

  describe('unverified accounts', () => {
    const email = 'vitest-login-unverified@example.com';

    async function seedUnverified() {
      const { id } = await seedUser({ email, password: seedPassword });
      await db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, id));
      return id;
    }

    it('returns 403 without a session when email is configured', async () => {
      await seedUnverified();
      vi.stubEnv('RESEND_API_KEY', 're_test');
      const response = await POST(loginRequest({ email, password: seedPassword }));
      expect(response.status).toBe(403);
      expect((await response.json()).code).toBe('email_not_verified');
      expect(response.headers.get('Set-Cookie')).toBeNull();
    });

    it('still reports invalid credentials for a wrong password', async () => {
      await seedUnverified();
      vi.stubEnv('RESEND_API_KEY', 're_test');
      const response = await POST(loginRequest({ email, password: 'wrong' }));
      expect(response.status).toBe(401);
    });

    it('allows sign-in when email is not configured', async () => {
      await seedUnverified();
      const response = await POST(loginRequest({ email, password: seedPassword }));
      expect(response.status).toBe(200);
    });
  });
});
