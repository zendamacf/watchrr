import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import { db } from '@/lib/db';
import { email_verification_tokens, lower, users } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { seedUser } from '@/test/seeds';

const mockSendEmail = vi.fn();
vi.mock('@/lib/email/send', () => ({ sendEmail: (...args: unknown[]) => mockSendEmail(...args) }));

import { POST } from './route';

function signupRequest(body: unknown) {
  return new Request(`http://localhost${apiRoutes.auth.signup}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/signup', () => {
  const previousAllowSignup = process.env.ALLOW_SIGNUP;

  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
    delete process.env.ALLOW_SIGNUP;
    mockSendEmail.mockReset();
    vi.stubEnv('RESEND_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (previousAllowSignup === undefined) {
      delete process.env.ALLOW_SIGNUP;
    } else {
      process.env.ALLOW_SIGNUP = previousAllowSignup;
    }
  });

  it('returns 403 when signup is disabled', async () => {
    process.env.ALLOW_SIGNUP = 'false';
    const response = await POST(signupRequest({ email: 'new@example.com', password: seedPassword }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: 'New user registration is disabled' });
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

  it.each([
    'not-an-email',
    'a@b',
    'a b@example.com',
    '@example.com',
    'a@@example.com',
    `${'x'.repeat(250)}@example.com`,
  ])('returns 400 for malformed email %s', async (email) => {
    const response = await POST(signupRequest({ email, password: seedPassword }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Enter a valid email address' });
  });

  it('stamps the account verified when email is not configured', async () => {
    const email = `vitest-signup-${randomUUID()}@example.com`;
    await POST(signupRequest({ email, password: seedPassword }));
    const [row] = await db
      .select()
      .from(users)
      .where(eq(lower(users.email), email));
    expect(row?.emailVerifiedAt).toBeInstanceOf(Date);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('creates an unverified account and emails a link, without a session, when email is configured', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('APP_URL', 'https://watchrr.test');
    const email = `vitest-signup-${randomUUID()}@example.com`;

    const response = await POST(signupRequest({ email, password: seedPassword }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ requiresVerification: true });
    expect(response.headers.get('Set-Cookie')).toBeNull();

    const [row] = await db
      .select()
      .from(users)
      .where(eq(lower(users.email), email));
    expect(row?.emailVerifiedAt).toBeNull();
    const tokens = await db
      .select()
      .from(email_verification_tokens)
      .where(eq(email_verification_tokens.user_id, row?.id ?? ''));
    expect(tokens).toHaveLength(1);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [type, to, props] = mockSendEmail.mock.calls[0] as [string, string, { verifyUrl: string }];
    expect(type).toBe('verifyEmail');
    expect(to).toBe(email);
    expect(props.verifyUrl).toMatch(/^https:\/\/watchrr\.test\/verify-email\?token=[\w-]+$/);
  });
});
