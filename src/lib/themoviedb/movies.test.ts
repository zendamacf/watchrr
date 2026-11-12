import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSearchMovies = vi.fn();
const mockMovieDetails = vi.fn();
const mockMovieRecommendations = vi.fn();

vi.mock('./client', () => ({
  tmdb: {
    search: { movies: (...args: unknown[]) => mockSearchMovies(...args) },
    movies: {
      details: (...args: unknown[]) => mockMovieDetails(...args),
      recommendations: (...args: unknown[]) => mockMovieRecommendations(...args),
    },
  },
}));

import { getMovie, getMovieDetails, getMovieRecommendations, search } from './movies';

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

describe('themoviedb movies', () => {
  beforeEach(() => {
    mockSearchMovies.mockReset();
    mockMovieDetails.mockReset();
    mockMovieRecommendations.mockReset();
  });

  it('getMovieRecommendations maps TMDB recommendations to TMDBMovie', async () => {
    mockMovieRecommendations.mockResolvedValue({
      results: [
        {
          id: 680,
          title: 'Pulp Fiction',
          overview: 'Desc',
          poster_path: '/p.jpg',
          backdrop_path: null,
          release_date: '1994-09-10',
        },
      ],
    });

    const results = await getMovieRecommendations(550);
    expect(results).toEqual([
      expect.objectContaining({
        id: 680,
        name: 'Pulp Fiction',
        poster: '/p.jpg',
        backdrop: null,
        runtime: null,
        genres: [],
      }),
    ]);
    expect(mockMovieRecommendations).toHaveBeenCalledWith(550);
  });

  it('search maps TMDB search results to TMDBMovie', async () => {
    mockSearchMovies.mockResolvedValue({
      results: [
        {
          id: 550,
          title: 'Fight Club',
          overview: 'An insomniac office worker...',
          poster_path: '/poster.jpg',
          backdrop_path: '/backdrop.jpg',
          release_date: '1999-10-15',
        },
      ],
    });

    const results = await search('fight club');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 550,
      name: 'Fight Club',
      description: 'An insomniac office worker...',
      poster: '/poster.jpg',
      backdrop: '/backdrop.jpg',
    });
    expect(DateTime.fromISO(results[0]?.releasedate ?? '').toISODate()).toBe('1999-10-15');
    expect(mockSearchMovies).toHaveBeenCalledWith({ query: 'fight club' });
  });

  it('getMovie maps TMDB movie details to TMDBMovie', async () => {
    mockMovieDetails.mockResolvedValue({
      id: 550,
      title: 'Fight Club',
      overview: 'Description',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      release_date: '1999-10-15',
      runtime: 139,
      genres: [{ id: 18, name: 'Drama' }],
    });

    const movie = await getMovie(550);
    expect(movie).toMatchObject({
      id: 550,
      name: 'Fight Club',
      description: 'Description',
      poster: '/poster.jpg',
      backdrop: '/backdrop.jpg',
      runtime: 139,
      genres: [{ id: 18, name: 'Drama' }],
    });
    expect(DateTime.fromISO(movie.releasedate!).toISODate()).toBe('1999-10-15');
    expect(mockMovieDetails).toHaveBeenCalledWith(550);
  });

  it('getMovie uses null releasedate when release_date is missing', async () => {
    mockMovieDetails.mockResolvedValue({
      id: 1486200,
      title: 'Jack of Spades',
      overview: 'Description',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      release_date: null,
    });

    const movie = await getMovie(1486200);
    expect(movie.releasedate).toBeNull();
  });

  it('getMovie maps a missing or zero runtime to null', async () => {
    mockMovieDetails.mockResolvedValue({
      id: 2,
      title: 'No Runtime',
      overview: '',
      poster_path: null,
      backdrop_path: null,
      release_date: '2000-01-01',
      runtime: 0,
    });

    expect((await getMovie(2)).runtime).toBeNull();
  });

  it('getMovie uses null poster when poster_path is missing', async () => {
    mockMovieDetails.mockResolvedValue({
      id: 1,
      title: 'No Poster',
      overview: '',
      poster_path: null,
      backdrop_path: '/backdrop.jpg',
      release_date: '2000-01-01',
    });

    const movie = await getMovie(1);
    expect(movie.poster).toBeNull();
  });

  it('getMovieDetails maps ratings, genres and extras from one request', async () => {
    mockMovieDetails.mockResolvedValue(detailsResponse);

    expect(await getMovieDetails(550)).toEqual({
      tagline: 'A tagline',
      genres: ['Drama'],
      rating: 8.4,
      votes: 100,
      runtime: 139,
      seasons: null,
      status: 'Released',
      cast: [{ name: 'Edward Norton', character: 'Narrator', photo: '/norton.jpg' }],
      trailer: 'abc',
      watch: { NZ: { link: 'https://tmdb/nz', providers: [{ name: 'Neon', logo: '/neon.jpg' }] } },
    });
    expect(mockMovieDetails).toHaveBeenCalledWith(550, ['credits', 'videos', 'watch/providers']);
  });

  it('getMovieDetails treats missing values as empty', async () => {
    mockMovieDetails.mockResolvedValue({ vote_average: 0, vote_count: 0, runtime: 0, tagline: '', status: '' });

    expect(await getMovieDetails(1)).toEqual({
      tagline: null,
      genres: [],
      rating: null,
      votes: 0,
      runtime: null,
      seasons: null,
      status: null,
      cast: [],
      trailer: null,
      watch: {},
    });
  });
});
