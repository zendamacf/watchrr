import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CRON_REFRESH_MODE,
  getMovieStaleBefore,
  getShowImminentEpisodeWindow,
  getShowStaleBefore,
  movieNeedsCronRefresh,
} from './cron-refresh';

describe('cron refresh selection', () => {
  it('uses incremental as the default refresh mode', () => {
    expect(DEFAULT_CRON_REFRESH_MODE).toBe('incremental');
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

  it('uses fixed stale hour windows', () => {
    const now = DateTime.fromISO('2026-03-01T12:00:00.000Z', { zone: 'utc' });
    expect(getMovieStaleBefore(now).getTime()).toBe(now.minus({ hours: 168 }).toJSDate().getTime());
    expect(getShowStaleBefore(now).getTime()).toBe(now.minus({ hours: 48 }).toJSDate().getTime());
  });
});
