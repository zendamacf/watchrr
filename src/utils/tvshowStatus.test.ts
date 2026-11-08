import { describe, expect, it } from 'vitest';
import {
  formatTvShowStatusLabel,
  isKnownTmdbTvShowStatus,
  TV_SHOW_STATUS_FILTER_ALL,
  TV_SHOW_STATUS_FILTER_UNKNOWN,
} from './tvshowStatus';

describe('tvshowStatus', () => {
  it('recognizes TMDB status values', () => {
    expect(isKnownTmdbTvShowStatus('Ended')).toBe(true);
    expect(isKnownTmdbTvShowStatus('Returning Series')).toBe(true);
    expect(isKnownTmdbTvShowStatus('Not Real')).toBe(false);
    expect(isKnownTmdbTvShowStatus(null)).toBe(false);
  });

  it('formats labels for display', () => {
    expect(formatTvShowStatusLabel('Returning Series')).toBe('Returning series');
    expect(formatTvShowStatusLabel('Ended')).toBe('Ended');
  });
});
