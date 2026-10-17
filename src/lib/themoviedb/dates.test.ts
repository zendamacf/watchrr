import { describe, expect, it } from 'vitest';
import { tmdbDateToIso } from './dates';

describe('tmdbDateToIso', () => {
  it('returns an ISO string for a TMDB date', () => {
    expect(tmdbDateToIso('1999-10-15')).toMatch(/^1999-10-15/);
  });

  it('returns null for missing values', () => {
    expect(tmdbDateToIso(null)).toBeNull();
    expect(tmdbDateToIso(undefined)).toBeNull();
    expect(tmdbDateToIso('')).toBeNull();
  });
});
