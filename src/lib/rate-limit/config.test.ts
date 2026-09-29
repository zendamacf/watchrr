import { afterEach, describe, expect, it } from 'vitest';
import { getRateLimitPolicy, isRateLimitEnabled, resolveRateLimitClass } from './config';

describe('rate limit config', () => {
  const keys = ['RATE_LIMIT_ENABLED', 'CRON_SECRET', 'RATE_LIMIT_AUTH_MAX', 'RATE_LIMIT_AUTH_WINDOW_SEC'] as const;
  const previous: Partial<Record<(typeof keys)[number], string>> = {};

  afterEach(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });

  it('can be disabled with RATE_LIMIT_ENABLED=false', () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    expect(isRateLimitEnabled()).toBe(false);
  });

  it('classifies auth and search routes', () => {
    expect(resolveRateLimitClass('/api/auth/login', null)).toBe('auth');
    expect(resolveRateLimitClass('/api/tvshow/search', null)).toBe('search');
    expect(resolveRateLimitClass('/api/episode', null)).toBe('api');
  });

  it('uses a higher class for authenticated cron refresh', () => {
    process.env.CRON_SECRET = 'cron-test-secret';
    expect(resolveRateLimitClass('/api/refresh', 'Bearer cron-test-secret')).toBe('cronAuthed');
    expect(resolveRateLimitClass('/api/refresh', 'Bearer wrong')).toBe('cron');
  });

  it('reads custom auth limits from env', () => {
    process.env.RATE_LIMIT_AUTH_MAX = '5';
    process.env.RATE_LIMIT_AUTH_WINDOW_SEC = '60';
    expect(getRateLimitPolicy('auth')).toMatchObject({ max: 5, windowMs: 60_000 });
  });

  it('exposes policies for search, cron, cronAuthed, and default API routes', () => {
    expect(getRateLimitPolicy('search').class).toBe('search');
    expect(getRateLimitPolicy('cron').class).toBe('cron');
    expect(getRateLimitPolicy('cronAuthed').class).toBe('cronAuthed');
    expect(getRateLimitPolicy('api').class).toBe('api');
  });

  it('falls back when env values are invalid', () => {
    process.env.RATE_LIMIT_SEARCH_MAX = 'not-a-number';
    expect(getRateLimitPolicy('search').max).toBe(60);
  });
});
