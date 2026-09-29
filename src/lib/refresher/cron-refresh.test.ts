import { DateTime } from 'luxon';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getCronRefreshMode,
  getMovieStaleBefore,
  getShowImminentEpisodeWindow,
  getShowStaleBefore,
  movieNeedsCronRefresh,
  readPositiveIntEnv,
} from './cron-refresh';

describe('cron refresh selection', () => {
  afterEach(() => {
    delete process.env.CRON_REFRESH_MODE;
    delete process.env.CRON_MOVIE_STALE_HOURS;
    delete process.env.CRON_SHOW_STALE_HOURS;
    delete process.env.CRON_SHOW_RECENT_EPISODE_DAYS;
    delete process.env.CRON_SHOW_IMMINENT_EPISODE_DAYS;
  });

  it('defaults to incremental mode', () => {
    delete process.env.CRON_REFRESH_MODE;
    expect(getCronRefreshMode()).toBe('incremental');
  });

  it('honors full mode from env', () => {
    process.env.CRON_REFRESH_MODE = 'full';
    expect(getCronRefreshMode()).toBe('full');
  });

  it('refreshes movies when metadata was never synced', () => {
    const staleBefore = getMovieStaleBefore(DateTime.fromISO('2026-01-10T00:00:00.000Z', { zone: 'utc' }));
    expect(movieNeedsCronRefresh(null, 'incremental', staleBefore)).toBe(true);
  });

  it('skips fresh movies in incremental mode', () => {
    const now = DateTime.fromISO('2026-01-10T12:00:00.000Z', { zone: 'utc' });
    const staleBefore = getMovieStaleBefore(now);
    expect(movieNeedsCronRefresh(now.minus({ hours: 1 }).toJSDate(), 'incremental', staleBefore)).toBe(false);
    expect(movieNeedsCronRefresh(now.minus({ hours: 200 }).toJSDate(), 'incremental', staleBefore)).toBe(true);
  });

  it('always refreshes in full mode', () => {
    const staleBefore = getMovieStaleBefore();
    expect(movieNeedsCronRefresh(new Date(), 'full', staleBefore)).toBe(true);
  });

  it('computes an episode airdate window', () => {
    const window = getShowImminentEpisodeWindow(DateTime.fromISO('2026-06-01T00:00:00.000Z', { zone: 'utc' }));
    expect(window.start).toBe('2026-05-25');
    expect(window.end).toBe('2026-06-15');
  });

  it('reads stale hour windows from env with safe fallbacks', () => {
    process.env.CRON_SHOW_STALE_HOURS = '12';
    process.env.CRON_SHOW_IMMINENT_EPISODE_DAYS = '3';
    const now = DateTime.fromISO('2026-03-01T12:00:00.000Z', { zone: 'utc' });
    expect(getShowStaleBefore(now).getTime()).toBe(now.minus({ hours: 12 }).toJSDate().getTime());
    expect(getShowImminentEpisodeWindow(now).end).toBe('2026-03-04');
    expect(readPositiveIntEnv('CRON_MOVIE_STALE_HOURS', 99)).toBe(99);
    process.env.CRON_MOVIE_STALE_HOURS = 'bad';
    expect(readPositiveIntEnv('CRON_MOVIE_STALE_HOURS', 99)).toBe(99);
  });
});
