import { describe, expect, it } from 'vitest';
import { getImageUrl } from './images';

describe('getImageUrl', () => {
  it('builds a w500 TMDB image URL from a path slug', () => {
    expect(getImageUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg');
  });
});
