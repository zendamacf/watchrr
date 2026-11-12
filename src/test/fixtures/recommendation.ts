import type { Recommendation } from '@/lib/recommendations/types';

export const testRecommendation: Recommendation = {
  type: 'movie',
  moviedb_id: 680,
  name: 'Pulp Fiction',
  description: 'A recommended movie',
  poster_slug: '/poster.jpg',
  backdrop_slug: '/backdrop.jpg',
  releasedate: '1994-09-10',
  country: null,
  score: 2,
  because: 'Fight Club',
};

export const testShowRecommendation: Recommendation = {
  ...testRecommendation,
  type: 'tvshow',
  moviedb_id: 1396,
  name: 'Breaking Bad',
  releasedate: null,
  country: 'US',
  because: 'The Wire',
};
