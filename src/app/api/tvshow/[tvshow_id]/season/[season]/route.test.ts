import '@/test/mocks/auth';
import { and, eq, inArray } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { watched_episodes } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextPut, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedEpisode, seedSubscribedTvShow, seedTvShow, seedUser } from '@/test/seeds';
import { PUT } from './route';

const unknownId = '00000000-0000-4000-8000-000000000096';

describe('PUT /api/tvshow/[tvshow_id]/season/[season]', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
  });

  beforeEach(() => {
    resetAuthGuardMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  it('returns 400 for a non-UUID tvshow id', async () => {
    const response = await PUT(
      nextPut(apiRoutes.tvshowSeasonWatch('bad', 1)),
      routeParams({ tvshow_id: 'bad', season: '1' }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 for an invalid season', async () => {
    const response = await PUT(
      nextPut(apiRoutes.tvshowSeasonWatch(unknownId, 1)),
      routeParams({ tvshow_id: unknownId, season: 'abc' }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Invalid season');
  });

  it('returns 400 for a negative season', async () => {
    const response = await PUT(
      nextPut(apiRoutes.tvshowSeasonWatch(unknownId, -1)),
      routeParams({ tvshow_id: unknownId, season: '-1' }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await PUT(
      nextPut(apiRoutes.tvshowSeasonWatch(unknownId, 1)),
      routeParams({ tvshow_id: unknownId, season: '1' }),
    );
    expect(response.status).toBe(401);
  });

  it('returns 404 when the user is not subscribed to the show', async () => {
    const show = await seedTvShow({ moviedb_id: 998_510, name: 'Unsubscribed Bulk Show' });
    await seedEpisode({
      tvshowId: show.id,
      overrides: { moviedb_id: 998_511, name: 'S1E1', season: 1, episode: 1 },
    });

    const response = await PUT(
      nextPut(apiRoutes.tvshowSeasonWatch(show.id, 1)),
      routeParams({ tvshow_id: show.id, season: '1' }),
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when the season has no episodes', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_512, name: 'Empty Season Show' },
    });

    const response = await PUT(
      nextPut(apiRoutes.tvshowSeasonWatch(tvshowId, 99)),
      routeParams({ tvshow_id: tvshowId, season: '99' }),
    );
    expect(response.status).toBe(404);
  });

  it('marks only episodes in the requested season', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_513, name: 'Multi Season Show' },
    });
    const s1e1 = await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_514, name: 'S1E1', season: 1, episode: 1 },
    });
    const s1e2 = await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_515, name: 'S1E2', season: 1, episode: 2 },
    });
    const s2e1 = await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_516, name: 'S2E1', season: 2, episode: 1 },
    });

    const response = await PUT(
      nextPut(apiRoutes.tvshowSeasonWatch(tvshowId, 1)),
      routeParams({ tvshow_id: tvshowId, season: '1' }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ message: 'Success', marked_count: 2 });

    const watchedRows = await db
      .select()
      .from(watched_episodes)
      .where(
        and(eq(watched_episodes.watcher_id, userId), inArray(watched_episodes.episode_id, [s1e1.id, s1e2.id, s2e1.id])),
      );
    expect(watchedRows.map((row) => row.episode_id).sort()).toEqual([s1e1.id, s1e2.id].sort());
  });

  it('is idempotent when called twice', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_517, name: 'Idempotent Season Show' },
    });
    const episode = await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_518, name: 'S1E1', season: 1, episode: 1 },
    });

    const params = routeParams({ tvshow_id: tvshowId, season: '1' });
    const first = await PUT(nextPut(apiRoutes.tvshowSeasonWatch(tvshowId, 1)), params);
    const second = await PUT(nextPut(apiRoutes.tvshowSeasonWatch(tvshowId, 1)), params);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await first.json()).toEqual({ message: 'Success', marked_count: 1 });
    expect(await second.json()).toEqual({ message: 'Success', marked_count: 1 });

    const watchedRows = await db
      .select()
      .from(watched_episodes)
      .where(and(eq(watched_episodes.watcher_id, userId), eq(watched_episodes.episode_id, episode.id)));
    expect(watchedRows).toHaveLength(1);
  });
});
