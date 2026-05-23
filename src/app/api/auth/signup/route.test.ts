import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import {
  mockHashPassword,
  mockLimit,
  mockReturning,
  resetAuthMocks,
} from '@/test/mocks';
import { testUser } from '@/test/fixtures/user';
import { POST } from './route';

function signupRequest(body: unknown) {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
    resetAuthMocks();
  });

  it('returns 400 for invalid JSON', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/signup', {
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

  it('returns 409 when email is already registered', async () => {
    mockLimit.mockResolvedValue([{ id: 'existing-id' }]);
    const response = await POST(signupRequest({ email: 'taken@example.com', password: 'secret' }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: 'An account with this email already exists',
    });
    expect(mockHashPassword).not.toHaveBeenCalled();
    expect(mockReturning).not.toHaveBeenCalled();
  });

  it('returns 201 with token and Set-Cookie on success', async () => {
    mockLimit.mockResolvedValue([]);
    mockHashPassword.mockResolvedValue('hashed-password');
    mockReturning.mockResolvedValue([{ id: testUser.id }]);
    const response = await POST(signupRequest({ email: '  New@Example.COM  ', password: 'secret' }));
    expect(response.status).toBe(201);
    expect(mockHashPassword).toHaveBeenCalledWith('secret');
    const body = await response.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');
  });

  it('returns 500 when insert returns no row', async () => {
    mockLimit.mockResolvedValue([]);
    mockHashPassword.mockResolvedValue('hashed-password');
    mockReturning.mockResolvedValue([]);
    const response = await POST(signupRequest({ email: 'new@example.com', password: 'secret' }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Failed to create account' });
  });
});
