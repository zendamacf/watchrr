import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSearchTvShows = vi.fn();
const mockTvShowDetails = vi.fn();
const mockTvSeasonDetails = vi.fn();

vi.mock('./client', () => ({
  tmdb: {
    search: { tvShows: (...args: unknown[]) => mockSearchTvShows(...args) },
    tvShows: { details: (...args: unknown[]) => mockTvShowDetails(...args) },
    tvSeasons: { details: (...args: unknown[]) => mockTvSeasonDetails(...args) },
  },
}));

import { getAllEpisodes, getTvShow, search } from './tvshows';

describe('themoviedb tvshows', () => {
  beforeEach(() => {
    mockSearchTvShows.mockReset();
    mockTvShowDetails.mockReset();
    mockTvSeasonDetails.mockReset();
  });

  it('search maps TMDB search results to TMDBTvShow', async () => {
    mockSearchTvShows.mockResolvedValue({
      results: [
        {
          id: 1399,
          name: 'Game of Thrones',
          overview: 'Nine noble families...',
          origin_country: ['US'],
          first_air_date: '2011-04-17',
          poster_path: '/poster.jpg',
          backdrop_path: '/backdrop.jpg',
        },
      ],
    });

    const results = await search('thrones');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 1399,
      name: 'Game of Thrones',
      description: 'Nine noble families...',
      country: 'US',
      poster: '/poster.jpg',
      backdrop: '/backdrop.jpg',
    });
    expect(DateTime.fromISO(results[0]?.firstAirDate ?? '').toISODate()).toBe('2011-04-17');
    expect(mockSearchTvShows).toHaveBeenCalledWith({ query: 'thrones' });
  });

  it('search uses null country when origin_country is empty', async () => {
    mockSearchTvShows.mockResolvedValue({
      results: [
        {
          id: 1,
          name: 'Show',
          overview: null,
          origin_country: [],
          first_air_date: '2020-06-01',
          poster_path: null,
          backdrop_path: null,
        },
      ],
    });

    const [show] = await search('show');
    expect(show?.country).toBeNull();
  });

  it('getTvShow maps TMDB show details to TMDBTvShow', async () => {
    mockTvShowDetails.mockResolvedValue({
      id: 1399,
      name: 'Game of Thrones',
      overview: 'Overview',
      origin_country: ['US', 'GB'],
      first_air_date: '2011-04-17',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
    });

    const show = await getTvShow(1399);
    expect(show).toMatchObject({
      id: 1399,
      name: 'Game of Thrones',
      description: 'Overview',
      country: 'US',
      poster: '/poster.jpg',
      backdrop: '/backdrop.jpg',
    });
    expect(DateTime.fromISO(show.firstAirDate).toISODate()).toBe('2011-04-17');
  });

  it('getAllEpisodes fetches each season and maps episodes', async () => {
    mockTvShowDetails.mockResolvedValue({
      id: 1399,
      seasons: [{ season_number: 1 }],
    });
    mockTvSeasonDetails.mockResolvedValue({
      episodes: [
        {
          id: 63056,
          season_number: 1,
          episode_number: 1,
          name: 'Winter Is Coming',
          overview: 'Pilot',
          air_date: '2011-04-17',
          still_path: '/still.jpg',
        },
        {
          id: 63057,
          season_number: 1,
          episode_number: 2,
          name: 'Unaired',
          overview: null,
          air_date: null,
          still_path: null,
        },
      ],
    });

    const episodes = await getAllEpisodes(1399);

    expect(episodes).toHaveLength(1);
    expect(episodes[0]).toMatchObject({
      id: 63056,
      seasonNumber: 1,
      episodeNumber: 1,
      name: 'Winter Is Coming',
      description: 'Pilot',
      backdrop: '/still.jpg',
      moviedb_id: 63056,
    });
    expect(DateTime.fromISO(episodes[0]?.airdate ?? '').toISODate()).toBe('2011-04-17');
    expect(mockTvSeasonDetails).toHaveBeenCalledWith({
      tvShowID: 1399,
      seasonNumber: 1,
    });
  });

  it('getAllEpisodes aggregates episodes across multiple seasons', async () => {
    mockTvShowDetails.mockResolvedValue({
      id: 100,
      seasons: [{ season_number: 1 }, { season_number: 2 }],
    });
    mockTvSeasonDetails
      .mockResolvedValueOnce({
        episodes: [
          {
            id: 1,
            season_number: 1,
            episode_number: 1,
            name: 'S1E1',
            overview: 'A',
            air_date: '2020-01-01',
            still_path: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        episodes: [
          {
            id: 2,
            season_number: 2,
            episode_number: 1,
            name: 'S2E1',
            overview: 'B',
            air_date: '2021-01-01',
            still_path: '/s2.jpg',
          },
        ],
      });

    const episodes = await getAllEpisodes(100);

    expect(episodes).toHaveLength(2);
    expect(mockTvSeasonDetails).toHaveBeenCalledTimes(2);
    expect(episodes[1]?.name).toBe('S2E1');
  });
});
