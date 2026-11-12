import '@/test/mocks/auth';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { genres, tvshow_genres, watched_episodes } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedEpisode, seedSubscribedTvShow, seedTvShow, seedTvShowRecommendation, seedUser } from '@/test/seeds';
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

  it('returns the show genres alphabetically, or none before the first refresh', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_525, name: 'Genre Detail Show' },
    });
    await db.delete(tvshow_genres).where(eq(tvshow_genres.tvshow_id, tvshowId));
    const before = await (
      await GET(nextGet(apiRoutes.tvshowEpisodes(tvshowId)), routeParams({ tvshow_id: tvshowId }))
    ).json();
    expect(before.genres).toEqual([]);

    await db
      .insert(genres)
      .values([
        { id: 990_031, name: 'Test Zombies' },
        { id: 990_032, name: 'Test Adventure' },
      ])
      .onConflictDoNothing();
    await db
      .insert(tvshow_genres)
      .values([
        { tvshow_id: tvshowId, genre_id: 990_031 },
        { tvshow_id: tvshowId, genre_id: 990_032 },
      ])
      .onConflictDoNothing();
    const after = await (
      await GET(nextGet(apiRoutes.tvshowEpisodes(tvshowId)), routeParams({ tvshow_id: tvshowId }))
    ).json();
    expect(after.genres).toEqual(['Test Adventure', 'Test Zombies']);
  });

  it('returns similar shows from cached recommendations', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_526, name: 'Has Similar Show' },
    });
    await seedTvShowRecommendation({ sourceTvShowId: tvshowId, moviedb_id: 998_527, name: 'Alike Show' });
    const body = await (
      await GET(nextGet(apiRoutes.tvshowEpisodes(tvshowId)), routeParams({ tvshow_id: tvshowId }))
    ).json();
    expect(body.similar).toEqual([
      {
        moviedb_id: 998_527,
        name: 'Alike Show',
        description: 'A recommended show',
        country: 'US',
        poster_slug: '/rec-poster.jpg',
      },
    ]);
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
