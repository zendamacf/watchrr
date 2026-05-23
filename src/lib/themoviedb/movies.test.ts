import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSearchMovies = vi.fn();
const mockMovieDetails = vi.fn();

vi.mock('./client', () => ({
  tmdb: {
    search: { movies: (...args: unknown[]) => mockSearchMovies(...args) },
    movies: { details: (...args: unknown[]) => mockMovieDetails(...args) },
  },
}));

import { getMovie, search } from './movies';

describe('themoviedb movies', () => {
  beforeEach(() => {
    mockSearchMovies.mockReset();
    mockMovieDetails.mockReset();
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
    });

    const movie = await getMovie(550);
    expect(movie).toMatchObject({
      id: 550,
      name: 'Fight Club',
      description: 'Description',
      poster: '/poster.jpg',
      backdrop: '/backdrop.jpg',
    });
    expect(DateTime.fromISO(movie.releasedate).toISODate()).toBe('1999-10-15');
    expect(mockMovieDetails).toHaveBeenCalledWith(550);
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
});
