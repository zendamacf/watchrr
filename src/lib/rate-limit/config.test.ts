import { afterEach, describe, expect, it } from 'vitest';
import { getRateLimitPolicy, resolveRateLimitClass } from './config';

describe('rate limit config', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('classifies auth and search routes', () => {
    expect(resolveRateLimitClass('/api/auth/login', null)).toBe('auth');
    expect(resolveRateLimitClass('/api/auth/signup', null)).toBe('auth');
    expect(resolveRateLimitClass('/api/movie/search', null)).toBe('search');
    expect(resolveRateLimitClass('/api/tvshow/search', null)).toBe('search');
    expect(resolveRateLimitClass('/api/episode', null)).toBe('api');
  });

  it('uses a higher class for authenticated cron refresh', () => {
    process.env.CRON_SECRET = 'cron-test-secret';
    expect(resolveRateLimitClass('/api/refresh', 'Bearer cron-test-secret')).toBe('cronAuthed');
    expect(resolveRateLimitClass('/api/refresh', 'Bearer wrong')).toBe('cron');
  });

  it('exposes fixed policies for each route class', () => {
    expect(getRateLimitPolicy('auth')).toMatchObject({ max: 20, windowMs: 900_000 });
    expect(getRateLimitPolicy('search')).toMatchObject({ max: 60, windowMs: 60_000 });
    expect(getRateLimitPolicy('cron')).toMatchObject({ max: 10, windowMs: 3_600_000 });
    expect(getRateLimitPolicy('cronAuthed')).toMatchObject({ max: 120, windowMs: 3_600_000 });
    expect(getRateLimitPolicy('api')).toMatchObject({ max: 300, windowMs: 60_000 });
  });
});
