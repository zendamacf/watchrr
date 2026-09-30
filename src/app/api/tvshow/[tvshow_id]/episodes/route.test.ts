import '@/test/mocks/auth';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { watched_episodes } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedEpisode, seedSubscribedTvShow, seedTvShow, seedUser } from '@/test/seeds';
import { GET } from './route';

const unknownId = '00000000-0000-4000-8000-000000000097';

describe('GET /api/tvshow/[tvshow_id]/episodes', () => {
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
    const response = await GET(nextGet(apiRoutes.tvshowEpisodes('bad')), routeParams({ tvshow_id: 'bad' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await GET(nextGet(apiRoutes.tvshowEpisodes(unknownId)), routeParams({ tvshow_id: unknownId }));
    expect(response.status).toBe(401);
  });

  it('returns 404 when the user is not subscribed to the show', async () => {
    const show = await seedTvShow({ moviedb_id: 998_520, name: 'Unsubscribed Detail Show' });
    const response = await GET(nextGet(apiRoutes.tvshowEpisodes(show.id)), routeParams({ tvshow_id: show.id }));
    expect(response.status).toBe(404);
  });

  it('returns episodes with watched flags ordered by season and episode', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_521, name: 'Detail Show' },
    });
    const unwatched = await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_522, name: 'S2E1', season: 2, episode: 1 },
    });
    const watched = await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_523, name: 'S1E1', season: 1, episode: 1 },
    });
    await db.insert(watched_episodes).values({ episode_id: watched.id, watcher_id: userId }).onConflictDoNothing();

    const response = await GET(nextGet(apiRoutes.tvshowEpisodes(tvshowId)), routeParams({ tvshow_id: tvshowId }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.tvshow.id).toBe(tvshowId);
    expect(body.tvshow.name).toBe('Detail Show');
    expect(body.subscription).toEqual({ delay_days: 0, snoozed_until: null });
    expect(body.episodes).toHaveLength(2);
    expect(body.episodes[0]).toMatchObject({ id: watched.id, season: 1, episode: 1, watched: true });
    expect(body.episodes[1]).toMatchObject({ id: unwatched.id, season: 2, episode: 1, watched: false });
  });

  it('returns an empty episode list when the show has no episodes', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_524, name: 'No Episodes Show' },
    });

    const response = await GET(nextGet(apiRoutes.tvshowEpisodes(tvshowId)), routeParams({ tvshow_id: tvshowId }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.episodes).toEqual([]);
  });
});
