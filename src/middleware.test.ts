import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as config from '@/lib/rate-limit/config';
import { resetRateLimitStoreForTests } from '@/lib/rate-limit/store';
import { middleware } from '@/middleware';

describe('middleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetRateLimitStoreForTests();
  });

  it('continues the request when under the rate limit', () => {
    const response = middleware(new NextRequest('http://localhost/api/movie'));
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

    expect(middleware(request).status).toBe(200);
    const blocked = middleware(request);
    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({ message: 'Too many requests' });
  });
});
