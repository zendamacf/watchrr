import type { Show } from '@/types';

export const testShow: Show = {
  id: 1,
  uuid: '00000000-0000-4000-8000-000000000001',
  name: 'Test Show',
  moviedb_id: 1399,
  country: 'US',
  poster_slug: '/poster.jpg',
  backdrop_slug: '/backdrop.jpg',
  description: 'A test show',
};

export const testTmdbTvShow = {
  id: 1399,
  name: 'Test Show',
  description: 'A test show',
  country: 'US',
  firstAirDate: '2011-04-17T00:00:00.000Z',
  poster: '/poster.jpg',
  backdrop: '/backdrop.jpg',
};
