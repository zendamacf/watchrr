import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { testEpisode } from '@/test/fixtures/episode';
import { testSubscription } from '@/test/fixtures/subscription';
import { testShow } from '@/test/fixtures/tvshow';
import { compareParsedEpisodes } from './compareParsedEpisodes';
import type { ParsedEpisode } from './types';

function makeParsedEpisode(overrides: {
  airdate?: string;
  showName?: string;
  season?: number;
  episode?: number;
  effectiveDate?: DateTime;
}): ParsedEpisode {
  const effectiveDate = overrides.effectiveDate ?? DateTime.fromSQL(overrides.airdate ?? '2099-01-01');
  return {
    episodes: {
      ...testEpisode,
      season: overrides.season ?? 1,
      episode: overrides.episode ?? 1,
      local_date: effectiveDate,
      original_local_date: effectiveDate,
      in_past: false,
      is_snoozed: false,
      delay_days: 0,
      snoozed_until: null,
    },
    tvshows: { ...testShow, name: overrides.showName ?? 'Show' },
    subscription: testSubscription,
  };
}

describe('compareParsedEpisodes', () => {
  it('sorts by effective local date before show name', () => {
    const earlier = makeParsedEpisode({ showName: 'Z Show', effectiveDate: DateTime.fromSQL('2099-09-10') });
    const later = makeParsedEpisode({ showName: 'A Show', effectiveDate: DateTime.fromSQL('2099-09-15') });

    expect(compareParsedEpisodes(earlier, later)).toBeLessThan(0);
    expect(compareParsedEpisodes(later, earlier)).toBeGreaterThan(0);
  });

  it('uses show name, season, and episode as tie breakers', () => {
    const sameDate = DateTime.fromSQL('2099-09-10');
    const showA = makeParsedEpisode({ showName: 'A Show', effectiveDate: sameDate, season: 1, episode: 1 });
    const showB = makeParsedEpisode({ showName: 'B Show', effectiveDate: sameDate, season: 1, episode: 1 });
    const laterSeason = makeParsedEpisode({ showName: 'A Show', effectiveDate: sameDate, season: 2, episode: 1 });

    expect(compareParsedEpisodes(showA, showB)).toBeLessThan(0);
    expect(compareParsedEpisodes(showA, laterSeason)).toBeLessThan(0);
  });
});
