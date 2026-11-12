import type { Movie } from '@/types';

export const testMovie: Movie = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Test Movie',
  releasedate: '2024-01-15',
  moviedb_id: 550,
  poster_slug: '/poster.jpg',
  backdrop_slug: '/backdrop.jpg',
  description: 'A test movie',
  runtime: 120,
  metadata_refreshed_at: null,
  recommendations_refreshed_at: null,
};

export const testTmdbMovie = {
  id: 550,
  name: 'Test Movie',
  description: 'A test movie',
  poster: '/poster.jpg',
  backdrop: '/backdrop.jpg',
  releasedate: '2024-01-15T00:00:00.000Z',
  runtime: 120,
};
