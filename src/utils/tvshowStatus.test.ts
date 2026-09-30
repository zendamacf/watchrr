import { describe, expect, it } from 'vitest';
import {
  formatTvShowStatusLabel,
  isKnownTmdbTvShowStatus,
  showMatchesStatusFilter,
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

  it('filters shows by status', () => {
    const ended = { status: 'Ended' as const };
    const unknown = { status: null };

    expect(showMatchesStatusFilter(ended, TV_SHOW_STATUS_FILTER_ALL)).toBe(true);
    expect(showMatchesStatusFilter(ended, 'Ended')).toBe(true);
    expect(showMatchesStatusFilter(ended, 'Returning Series')).toBe(false);
    expect(showMatchesStatusFilter(unknown, TV_SHOW_STATUS_FILTER_UNKNOWN)).toBe(true);
    expect(showMatchesStatusFilter(unknown, 'Ended')).toBe(false);
  });
});
