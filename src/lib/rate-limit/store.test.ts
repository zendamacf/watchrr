import { beforeEach, describe, expect, it } from 'vitest';
import { getRateLimitPolicy } from './config';
import { consumeRateLimit, resetRateLimitStoreForTests } from './store';

describe('consumeRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it('allows requests until the limit is exceeded', () => {
    const policy = { class: 'auth' as const, max: 2, windowMs: 60_000 };
    const now = 1_700_000_000_000;
    expect(consumeRateLimit('1.2.3.4', policy, now).allowed).toBe(true);
    expect(consumeRateLimit('1.2.3.4', policy, now).allowed).toBe(true);
    const blocked = consumeRateLimit('1.2.3.4', policy, now);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('tracks limits separately per client', () => {
    const policy = getRateLimitPolicy('search');
    const tight = { ...policy, max: 1 };
    expect(consumeRateLimit('a', tight).allowed).toBe(true);
    expect(consumeRateLimit('b', tight).allowed).toBe(true);
    expect(consumeRateLimit('a', tight).allowed).toBe(false);
  });
});
