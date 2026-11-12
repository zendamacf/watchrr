import { describe, expect, it } from 'vitest';
import { isMoviedbId, isRecommendationType } from './params';

describe('recommendation params', () => {
  it('accepts only known types', () => {
    expect(isRecommendationType('movie')).toBe(true);
    expect(isRecommendationType('tvshow')).toBe(true);
    expect(isRecommendationType('episode')).toBe(false);
    expect(isRecommendationType(undefined)).toBe(false);
    expect(isRecommendationType(1)).toBe(false);
  });

  it('accepts only positive 32-bit integer TMDB ids', () => {
    expect(isMoviedbId(550)).toBe(true);
    expect(isMoviedbId(2_147_483_647)).toBe(true);
    expect(isMoviedbId(2_147_483_648)).toBe(false);
    expect(isMoviedbId(0)).toBe(false);
    expect(isMoviedbId(-1)).toBe(false);
    expect(isMoviedbId(1.5)).toBe(false);
    expect(isMoviedbId('550')).toBe(false);
    expect(isMoviedbId(null)).toBe(false);
  });
});
