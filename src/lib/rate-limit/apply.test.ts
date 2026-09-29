import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyRateLimit } from './apply';
import { resetRateLimitStoreForTests } from './store';

function requestFor(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe('applyRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    process.env.RATE_LIMIT_ENABLED = 'true';
    process.env.RATE_LIMIT_AUTH_MAX = '2';
    process.env.RATE_LIMIT_AUTH_WINDOW_SEC = '60';
  });

  afterEach(() => {
    delete process.env.RATE_LIMIT_ENABLED;
    delete process.env.RATE_LIMIT_AUTH_MAX;
    delete process.env.RATE_LIMIT_AUTH_WINDOW_SEC;
    resetRateLimitStoreForTests();
  });

  it('returns null for non-API paths', () => {
    expect(applyRateLimit(requestFor('/episodes'))).toBeNull();
  });

  it('returns null when rate limiting is disabled', () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    expect(applyRateLimit(requestFor('/api/auth/login'))).toBeNull();
  });

  it('returns 429 with Retry-After when the auth limit is exceeded', async () => {
    const req = requestFor('/api/auth/login', { 'x-real-ip': '198.51.100.9' });
    expect(applyRateLimit(req)).toBeNull();
    expect(applyRateLimit(req)).toBeNull();
    const blocked = applyRateLimit(req);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get('Retry-After')).toBeTruthy();
    await expect(blocked?.json()).resolves.toEqual({ message: 'Too many requests' });
  });
});
