import { describe, expect, it } from 'vitest';
import { formatEpisodeNumber } from './formatEpisodeNumber';

describe('formatEpisodeNumber', () => {
  it('zero-pads season and episode', () => {
    expect(formatEpisodeNumber(1, 5)).toBe('S01E05');
    expect(formatEpisodeNumber(12, 3)).toBe('S12E03');
  });
});
