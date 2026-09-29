import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { resetRateLimitStoreForTests } from '@/lib/rate-limit/store';
import { middleware } from '@/middleware';

describe('middleware', () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_ENABLED;
    delete process.env.RATE_LIMIT_AUTH_MAX;
    delete process.env.RATE_LIMIT_AUTH_WINDOW_SEC;
    resetRateLimitStoreForTests();
  });

  it('delegates to NextResponse.next when rate limiting is disabled', () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    const response = middleware(new NextRequest('http://localhost/api/movie'));
    expect(response.status).toBe(200);
  });

  it('returns 429 when applyRateLimit blocks the request', async () => {
    process.env.RATE_LIMIT_ENABLED = 'true';
    process.env.RATE_LIMIT_AUTH_MAX = '1';
    process.env.RATE_LIMIT_AUTH_WINDOW_SEC = '60';
    const request = new NextRequest('http://localhost/api/auth/signup', {
      headers: { 'x-real-ip': '203.0.113.10' },
    });

    expect(middleware(request).status).toBe(200);
    const blocked = middleware(request);
    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({ message: 'Too many requests' });
  });
});
