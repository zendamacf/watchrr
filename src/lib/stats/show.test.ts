import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_tvshows, watched_episodes } from '@/lib/db/schema';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { seedEpisode, seedSubscribedTvShow, seedTvShow, seedUser } from '@/test/seeds';
import { getShowStats } from './show';

const now = DateTime.fromISO('2026-11-11T12:00:00Z', { zone: 'utc' });

describe('getShowStats', () => {
  let userId: string;
  let tvshowId: string;
  const episodeIds: string[] = [];

  beforeAll(async () => {
    userId = (await seedUser({ email: seedEmails.statsShow, password: seedPassword })).id;
    ({ tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 997_301, name: 'Show Stats' },
    }));
    // S1E1-E2 aired, S2E1 aired, S2E2 in the future.
    const specs = [
      { id: 997_311, season: 1, episode: 1, airdate: '2026-01-01', runtime: 40 },
      { id: 997_312, season: 1, episode: 2, airdate: '2026-01-08', runtime: 40 },
      { id: 997_313, season: 2, episode: 1, airdate: '2026-02-01', runtime: 50 },
      { id: 997_314, season: 2, episode: 2, airdate: '2027-03-01', runtime: 50 },
    ];
    for (const spec of specs) {
      const ep = await seedEpisode({
        tvshowId,
        overrides: {
          moviedb_id: spec.id,
          season: spec.season,
          episode: spec.episode,
          airdate: spec.airdate,
          runtime: spec.runtime,
        },
      });
      episodeIds.push(ep.id);
    }
  });

  beforeEach(async () => {
    await db.delete(watched_episodes).where(eq(watched_episodes.watcher_id, userId));
  });

  it('returns null when the user is not subscribed', async () => {
    const other = await seedTvShow({ moviedb_id: 997_302, name: 'Unsubscribed' });
    expect(await getShowStats({ userId, tvshowId: other.id, now })).toBeNull();
  });

  it('reports an empty state when nothing is watched', async () => {
    const stats = await getShowStats({ userId, tvshowId, now });
    expect(stats).toMatchObject({
      watched: 0,
      aired: 3,
      backlog: 3,
      backlogMinutes: 130,
      startedAt: null,
      lastWatchedAt: null,
      episodesPerWeek: null,
      nextAirDate: '2027-03-01',
    });
    expect(stats?.seasons).toEqual([
      { season: 1, watched: 0, aired: 2, total: 2 },
      { season: 2, watched: 0, aired: 1, total: 2 },
    ]);
  });

  it('computes progress, dates, pace and backlog time', async () => {
    await db.insert(watched_episodes).values([
      { episode_id: episodeIds[0]!, watcher_id: userId, watched_at: new Date('2026-10-01T10:00:00Z') },
      { episode_id: episodeIds[1]!, watcher_id: userId, watched_at: new Date('2026-10-15T10:00:00Z') },
    ]);
    const stats = await getShowStats({ userId, tvshowId, now });
    expect(stats).toMatchObject({ watched: 2, aired: 3, backlog: 1, backlogMinutes: 50 });
    expect(stats?.seasons[0]).toEqual({ season: 1, watched: 2, aired: 2, total: 2 });
    expect(stats?.startedAt).toContain('2026-10-01');
    expect(stats?.lastWatchedAt).toContain('2026-10-15');
    expect(stats?.episodesPerWeek).toBe(1); // 2 episodes over 2 weeks
  });

  it('counts watched episodes with no date but omits dates and pace', async () => {
    await db.insert(watched_episodes).values({ episode_id: episodeIds[0]!, watcher_id: userId, watched_at: null });
    const stats = await getShowStats({ userId, tvshowId, now });
    expect(stats).toMatchObject({ watched: 1, startedAt: null, lastWatchedAt: null, episodesPerWeek: null });
  });

  it('does not extrapolate a single binge beyond one week', async () => {
    await db.insert(watched_episodes).values([
      { episode_id: episodeIds[0]!, watcher_id: userId, watched_at: new Date('2026-10-01T10:00:00Z') },
      { episode_id: episodeIds[1]!, watcher_id: userId, watched_at: new Date('2026-10-01T11:00:00Z') },
    ]);
    expect((await getShowStats({ userId, tvshowId, now }))?.episodesPerWeek).toBe(2);
  });

  it('returns null backlogMinutes when no runtimes are known', async () => {
    const { tvshowId: bare } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 997_303, name: 'No Runtimes' },
    });
    await seedEpisode({ tvshowId: bare, overrides: { moviedb_id: 997_321, airdate: '2026-01-01', runtime: null } });
    expect((await getShowStats({ userId, tvshowId: bare, now }))?.backlogMinutes).toBeNull();
    await db.delete(subscribed_tvshows).where(eq(subscribed_tvshows.tvshow_id, bare));
  });
});
