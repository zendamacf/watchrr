import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import { signAccessToken } from '@/lib/auth/jwt';
import * as config from '@/lib/rate-limit/config';
import { resetRateLimitStoreForTests } from '@/lib/rate-limit/store';
import { middleware } from '@/middleware';

const userId = 'e1e31db5-d029-4ba7-aa65-fd6a5e7fdea';

async function authedRequest(url: string) {
  const token = await signAccessToken(userId);
  return new NextRequest(url, {
    headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
  });
}

describe('middleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetRateLimitStoreForTests();
  });

  it('continues public API requests when under the rate limit', async () => {
    const response = await middleware(new NextRequest('http://localhost/api/auth/login'));
    expect(response.status).toBe(200);
  });

  it('returns 429 when applyRateLimit blocks the request', async () => {
    vi.spyOn(config, 'getRateLimitPolicy').mockReturnValue({
      class: 'auth',
      max: 1,
      windowMs: 60_000,
    });
    const request = new NextRequest('http://localhost/api/auth/signup', {
      headers: { 'x-real-ip': '203.0.113.10' },
    });

    expect((await middleware(request)).status).toBe(200);
    const blocked = await middleware(request);
    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({ message: 'Too many requests' });
  });

  it('returns 401 for protected API routes without a session', async () => {
    const response = await middleware(new NextRequest('http://localhost/api/movie'));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Unauthorized' });
  });

  it('allows protected API routes with a valid session cookie', async () => {
    const response = await middleware(await authedRequest('http://localhost/api/movie'));
    expect(response.status).toBe(200);
  });

  it('does not require a session for public API routes', async () => {
    const response = await middleware(new NextRequest('http://localhost/api/auth/login'));
    expect(response.status).toBe(200);
  });

  it('redirects unauthenticated users from app pages to sign-in', async () => {
    const response = await middleware(new NextRequest('http://localhost/episodes'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/signin');
  });

  it('allows authenticated users to reach app pages', async () => {
    const response = await middleware(await authedRequest('http://localhost/episodes'));
    expect(response.status).toBe(200);
  });

  it('allows unauthenticated access to sign-in', async () => {
    const response = await middleware(new NextRequest('http://localhost/signin'));
    expect(response.status).toBe(200);
  });
});
