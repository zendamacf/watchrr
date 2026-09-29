import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { resetRateLimitStoreForTests } from '@/lib/rate-limit/store';
import { middleware } from '@/middleware';

describe('middleware', () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_ENABLED;
    resetRateLimitStoreForTests();
  });

  it('delegates to NextResponse.next when rate limiting is disabled', () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    const response = middleware(new NextRequest('http://localhost/api/movie'));
    expect(response.status).toBe(200);
  });
});
