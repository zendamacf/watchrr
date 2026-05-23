import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';
import { POST } from './route';

function signupRequest(body: unknown) {
  return new Request(`http://localhost${apiRoutes.auth.signup}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
  });

  it('returns 400 for invalid JSON', async () => {
    const response = await POST(
      new Request(`http://localhost${apiRoutes.auth.signup}`, {
        method: 'POST',
        body: 'not json',
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid request body' });
  });

  it('returns 400 when email or password is missing', async () => {
    const response = await POST(signupRequest({ email: 'a@b.com' }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Email and password are required' });
  });

  it('returns 400 when email or password is empty after trim', async () => {
    const response = await POST(signupRequest({ email: '  ', password: 'x' }));
    expect(response.status).toBe(400);
  });

  it('returns 409 when email is already registered', async () => {
    await seedUser({ email: seedEmails.signupTaken, password: seedPassword });
    const response = await POST(signupRequest({ email: seedEmails.signupTaken, password: 'other-secret' }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: 'An account with this email already exists',
    });
  });

  it('returns 201 with token and Set-Cookie on success', async () => {
    const email = `vitest-signup-${randomUUID()}@example.com`;
    const response = await POST(signupRequest({ email: `  ${email}  `, password: seedPassword }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');
  });
});
