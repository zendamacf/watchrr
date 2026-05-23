import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import { POST } from './route';

const mockLimit = vi.fn();
const mockVerifyPassword = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: (...args: unknown[]) => mockLimit(...args),
        }),
      }),
    }),
  },
}));

vi.mock('@/lib/auth/password', () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

const user = {
  id: 'e1e31db5-d029-4ba7-aa65-fd6a5e7fdea',
  email: 'test@example.com',
  passwordHash: 'hashed',
  createdAt: new Date(),
};

function loginRequest(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
    mockLimit.mockReset();
    mockVerifyPassword.mockReset();
  });

  it('returns 400 for invalid JSON', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/login', {
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
    mockLimit.mockResolvedValue([user]);
    mockVerifyPassword.mockResolvedValue(false);
    const response = await POST(loginRequest({ email: 'test@example.com', password: 'wrong' }));
    expect(response.status).toBe(401);
    expect(mockVerifyPassword).toHaveBeenCalledWith('wrong', user.passwordHash);
  });

  it('returns 200 with token and Set-Cookie on success', async () => {
    mockLimit.mockResolvedValue([user]);
    mockVerifyPassword.mockResolvedValue(true);
    const response = await POST(loginRequest({ email: '  Test@Example.COM  ', password: 'secret' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');
    expect(mockVerifyPassword).toHaveBeenCalledWith('secret', user.passwordHash);
  });
});
