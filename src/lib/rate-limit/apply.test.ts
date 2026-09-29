import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyRateLimit } from './apply';
import * as config from './config';
import { resetRateLimitStoreForTests } from './store';

function requestFor(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe('applyRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetRateLimitStoreForTests();
  });

  it('returns null for non-API paths', () => {
    expect(applyRateLimit(requestFor('/episodes'))).toBeNull();
  });

  it('returns 429 with Retry-After when the auth limit is exceeded', async () => {
    vi.spyOn(config, 'getRateLimitPolicy').mockReturnValue({
      class: 'auth',
      max: 2,
      windowMs: 60_000,
    });
    const req = requestFor('/api/auth/login', { 'x-real-ip': '198.51.100.9' });
    expect(applyRateLimit(req)).toBeNull();
    expect(applyRateLimit(req)).toBeNull();
    const blocked = applyRateLimit(req);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get('Retry-After')).toBeTruthy();
    await expect(blocked?.json()).resolves.toEqual({ message: 'Too many requests' });
  });
});
