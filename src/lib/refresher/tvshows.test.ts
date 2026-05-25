import '@/test/mocks/themoviedb';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { episodes, tvshows } from '@/lib/db/schema';
import { mockGetAllEpisodes, mockGetTvShow, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { seedEpisode, seedTvShow } from '@/test/seeds';
import { ResourceNotFound } from './errors';
import { refreshTvShow } from './tvshows';

const SHOW_UNCHANGED = 999_201;
const SHOW_EPISODES = 999_202;
const SHOW_EPISODE_UPDATE = 999_203;

function tmdbShow(
  moviedb_id: number,
  overrides: Partial<{
    name: string;
    description: string | null;
    country: string | null;
    poster: string | null;
    backdrop: string | null;
  }> = {},
) {
  return {
    id: moviedb_id,
    name: 'Synced Show',
    description: 'Synced overview',
    country: 'US',
    firstAirDate: '2011-04-17T00:00:00.000Z',
    poster: '/synced-poster.jpg',
    backdrop: '/synced-backdrop.jpg',
    ...overrides,
  };
}

describe('refreshTvShow', () => {
  beforeEach(() => {
    resetThemoviedbMocks();
  });

  it('throws ResourceNotFound when the show row does not exist', async () => {
    await expect(refreshTvShow('00000000-0000-4000-8000-000000009999')).rejects.toBeInstanceOf(ResourceNotFound);
    expect(mockGetTvShow).not.toHaveBeenCalled();
  });

  it('skips show update when metadata already matches TMDB', async () => {
    const show = await seedTvShow({
      moviedb_id: SHOW_UNCHANGED,
      name: 'Synced Show',
      description: 'Synced overview',
      country: 'US',
      poster_slug: '/synced-poster.jpg',
      backdrop_slug: '/synced-backdrop.jpg',
    });
    mockGetTvShow.mockResolvedValue(tmdbShow(SHOW_UNCHANGED));
    mockGetAllEpisodes.mockResolvedValue([]);

    await refreshTvShow(show.id);

    const [after] = await db.select().from(tvshows).where(eq(tvshows.id, show.id));
    expect(after?.name).toBe('Synced Show');
  });

  it('updates show metadata when TMDB differs', async () => {
    const show = await seedTvShow({
      moviedb_id: SHOW_EPISODES,
      name: 'Old Show Name',
      description: 'Old overview',
      country: 'GB',
      poster_slug: '/old.jpg',
      backdrop_slug: '/old-back.jpg',
    });
    mockGetTvShow.mockResolvedValue(
      tmdbShow(SHOW_EPISODES, {
        name: 'New Show Name',
        description: 'New overview',
        country: 'US',
        poster: '/new.jpg',
        backdrop: '/new-back.jpg',
      }),
    );
    mockGetAllEpisodes.mockResolvedValue([
      {
        id: 900_001,
        seasonNumber: 1,
        episodeNumber: 1,
        name: 'Premiere',
        description: 'First ep',
        airdate: '2020-01-01T00:00:00.000Z',
        backdrop: '/ep1.jpg',
      },
      {
        id: 900_002,
        seasonNumber: 1,
        episodeNumber: 2,
        name: 'Second',
        description: 'Second ep',
        airdate: '2020-01-08T00:00:00.000Z',
        backdrop: '/ep2.jpg',
      },
    ]);

    await refreshTvShow(show.id);

    const [afterShow] = await db.select().from(tvshows).where(eq(tvshows.id, show.id));
    expect(afterShow).toMatchObject({
      name: 'New Show Name',
      description: 'New overview',
      country: 'US',
      poster_slug: '/new.jpg',
      backdrop_slug: '/new-back.jpg',
    });

    const afterEpisodes = await db.select().from(episodes).where(eq(episodes.tvshow_id, show.id));
    expect(afterEpisodes).toHaveLength(2);
    expect(afterEpisodes.map((e) => e.moviedb_id).sort()).toEqual([900_001, 900_002]);
    expect(afterEpisodes.find((e) => e.moviedb_id === 900_001)?.name).toBe('Premiere');
  });

  it('updates an existing episode when TMDB metadata differs', async () => {
    const show = await seedTvShow({
      moviedb_id: SHOW_EPISODE_UPDATE,
      name: 'Episode Update Show',
      description: 'Show',
      country: 'US',
      poster_slug: '/p.jpg',
      backdrop_slug: '/b.jpg',
    });
    await seedEpisode({
      tvshowId: show.id,
      overrides: {
        moviedb_id: 900_101,
        season: 1,
        episode: 1,
        name: 'Old Episode Title',
        description: 'Old ep description',
        airdate: '2019-05-01',
        backdrop_slug: '/old-ep.jpg',
      },
    });
    mockGetTvShow.mockResolvedValue(tmdbShow(SHOW_EPISODE_UPDATE));
    mockGetAllEpisodes.mockResolvedValue([
      {
        id: 900_101,
        seasonNumber: 1,
        episodeNumber: 1,
        name: 'New Episode Title',
        description: 'New ep description',
        airdate: '2019-05-01T00:00:00.000Z',
        backdrop: '/new-ep.jpg',
      },
    ]);

    await refreshTvShow(show.id);

    const [afterEpisode] = await db.select().from(episodes).where(eq(episodes.moviedb_id, 900_101));
    expect(afterEpisode).toMatchObject({
      name: 'New Episode Title',
      description: 'New ep description',
      backdrop_slug: '/new-ep.jpg',
      airdate: '2019-05-01',
    });
  });

  it('leaves matching episodes unchanged', async () => {
    const show = await seedTvShow({
      moviedb_id: 999_204,
      name: 'No Episode Change',
      description: 'Show',
      country: 'US',
      poster_slug: '/p.jpg',
      backdrop_slug: '/b.jpg',
    });
    await seedEpisode({
      tvshowId: show.id,
      overrides: {
        moviedb_id: 900_201,
        season: 2,
        episode: 3,
        name: 'Stable Episode',
        description: 'Same',
        airdate: '2021-07-04',
        backdrop_slug: '/stable.jpg',
      },
    });
    mockGetTvShow.mockResolvedValue(
      tmdbShow(999_204, {
        name: 'No Episode Change',
        description: 'Show',
        country: 'US',
        poster: '/p.jpg',
        backdrop: '/b.jpg',
      }),
    );
    mockGetAllEpisodes.mockResolvedValue([
      {
        id: 900_201,
        seasonNumber: 2,
        episodeNumber: 3,
        name: 'Stable Episode',
        description: 'Same',
        airdate: '2021-07-04T00:00:00.000Z',
        backdrop: '/stable.jpg',
      },
    ]);

    await refreshTvShow(show.id);

    const episodeRows = await db.select().from(episodes).where(eq(episodes.tvshow_id, show.id));
    expect(episodeRows).toHaveLength(1);
    expect(episodeRows[0]?.name).toBe('Stable Episode');
  });
});
