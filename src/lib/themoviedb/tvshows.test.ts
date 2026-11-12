import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSearchTvShows = vi.fn();
const mockTvShowDetails = vi.fn();
const mockTvSeasonDetails = vi.fn();
const mockTvRecommendations = vi.fn();

vi.mock('./client', () => ({
  tmdb: {
    search: { tvShows: (...args: unknown[]) => mockSearchTvShows(...args) },
    tvShows: {
      details: (...args: unknown[]) => mockTvShowDetails(...args),
      recommendations: (...args: unknown[]) => mockTvRecommendations(...args),
    },
    tvSeasons: { details: (...args: unknown[]) => mockTvSeasonDetails(...args) },
  },
}));

import { getAllEpisodes, getTvShow, getTvShowDetails, getTvShowRecommendations, search } from './tvshows';

const detailsResponse = {
  tagline: 'A tagline',
  genres: [{ id: 18, name: 'Drama' }],
  vote_average: 8.4,
  vote_count: 100,
  runtime: 139,
  number_of_seasons: 5,
  status: 'Released',
  credits: { cast: [{ name: 'Edward Norton', character: 'Narrator', profile_path: '/norton.jpg' }] },
  videos: { results: [{ key: 'abc', site: 'YouTube', type: 'Trailer', official: true }] },
  'watch/providers': {
    results: { NZ: { link: 'https://tmdb/nz', flatrate: [{ provider_name: 'Neon', logo_path: '/neon.jpg' }] } },
  },
};

describe('themoviedb tvshows', () => {
  beforeEach(() => {
    mockSearchTvShows.mockReset();
    mockTvShowDetails.mockReset();
    mockTvSeasonDetails.mockReset();
    mockTvRecommendations.mockReset();
  });

  it('getTvShowRecommendations maps TMDB recommendations to TMDBTvShow', async () => {
    mockTvRecommendations.mockResolvedValue({
      results: [
        {
          id: 1396,
          name: 'Breaking Bad',
          overview: 'Desc',
          origin_country: ['US'],
          first_air_date: '2008-01-20',
          poster_path: '/p.jpg',
          backdrop_path: null,
        },
        {
          id: 1,
          name: 'No Country',
          overview: '',
          origin_country: [],
          first_air_date: '2010-01-01',
          poster_path: null,
          backdrop_path: null,
        },
      ],
    });

    const results = await getTvShowRecommendations(1399);
    expect(results[0]).toMatchObject({
      id: 1396,
      name: 'Breaking Bad',
      country: 'US',
      poster: '/p.jpg',
      status: null,
      genres: [],
    });
    expect(results[1]?.country).toBeNull();
    expect(mockTvRecommendations).toHaveBeenCalledWith(1399);
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
      status: 'Ended',
      genres: [
        { id: 18, name: 'Drama' },
        { id: 10765, name: 'Sci-Fi & Fantasy' },
      ],
    });

    const show = await getTvShow(1399);
    expect(show).toMatchObject({
      id: 1399,
      name: 'Game of Thrones',
      description: 'Overview',
      country: 'US',
      poster: '/poster.jpg',
      backdrop: '/backdrop.jpg',
      status: 'Ended',
      genres: [
        { id: 18, name: 'Drama' },
        { id: 10765, name: 'Sci-Fi & Fantasy' },
      ],
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
          runtime: 62,
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
      runtime: 62,
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

  it('getTvShowDetails maps ratings, seasons and extras from one request', async () => {
    mockTvShowDetails.mockResolvedValue(detailsResponse);

    expect(await getTvShowDetails(1396)).toEqual({
      tagline: 'A tagline',
      genres: ['Drama'],
      rating: 8.4,
      votes: 100,
      runtime: null,
      seasons: 5,
      status: 'Released',
      cast: [{ name: 'Edward Norton', character: 'Narrator', photo: '/norton.jpg' }],
      trailer: 'abc',
      watch: { NZ: { link: 'https://tmdb/nz', providers: [{ name: 'Neon', logo: '/neon.jpg' }] } },
    });
    expect(mockTvShowDetails).toHaveBeenCalledWith(1396, ['credits', 'videos', 'watch/providers']);
  });

  it('getTvShowDetails treats missing values as empty', async () => {
    mockTvShowDetails.mockResolvedValue({ vote_count: 0, number_of_seasons: 0 });

    expect(await getTvShowDetails(1)).toMatchObject({
      genres: [],
      rating: null,
      votes: 0,
      seasons: null,
      status: null,
    });
  });
});
