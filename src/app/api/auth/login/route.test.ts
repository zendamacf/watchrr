import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import { apiRoutes } from '@/lib/routes';
import { mockLimit, mockVerifyPassword, resetAuthMocks } from '@/test/mocks';
import { testUser } from '@/test/fixtures/user';
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
    resetAuthMocks();
  });

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
    mockLimit.mockResolvedValue([]);
    const response = await POST(loginRequest({ email: 'nobody@example.com', password: 'secret' }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid email or password' });
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('returns 401 when password does not match', async () => {
    mockLimit.mockResolvedValue([testUser]);
    mockVerifyPassword.mockResolvedValue(false);
    const response = await POST(loginRequest({ email: 'test@example.com', password: 'wrong' }));
    expect(response.status).toBe(401);
    expect(mockVerifyPassword).toHaveBeenCalledWith('wrong', testUser.passwordHash);
  });

  it('returns 200 with token and Set-Cookie on success', async () => {
    mockLimit.mockResolvedValue([testUser]);
    mockVerifyPassword.mockResolvedValue(true);
    const response = await POST(loginRequest({ email: '  Test@Example.COM  ', password: 'secret' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');
    expect(mockVerifyPassword).toHaveBeenCalledWith('secret', testUser.passwordHash);
  });
});
