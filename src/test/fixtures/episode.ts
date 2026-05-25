import type { Episode } from '@/types';

export const testEpisode: Episode = {
  id: '00000000-0000-4000-8000-000000000003',
  tvshow_id: '00000000-0000-4000-8000-000000000001',
  season: 1,
  episode: 1,
  name: 'Pilot',
  airdate: '2011-04-17',
  moviedb_id: 63056,
  backdrop_slug: '/backdrop.jpg',
  description: 'First episode',
};

export const testTmdbEpisode = {
  id: 63056,
  seasonNumber: 1,
  episodeNumber: 1,
  name: 'Pilot',
  description: 'First episode',
  airdate: '2011-04-17T00:00:00.000Z',
  backdrop: '/backdrop.jpg',
};
