import { describe, expect, it } from 'vitest';
import type { ShowEpisode } from '@/types';
import { groupEpisodesBySeason } from './groupEpisodesBySeason';

describe('groupEpisodesBySeason', () => {
  it('groups and sorts seasons ascending', () => {
    const episodes: ShowEpisode[] = [
      {
        id: '1',
        tvshow_id: 's',
        season: 2,
        episode: 1,
        name: 'A',
        airdate: '2020-01-01',
        moviedb_id: 1,
        backdrop_slug: null,
        description: null,
        watched: false,
      },
      {
        id: '2',
        tvshow_id: 's',
        season: 1,
        episode: 2,
        name: 'B',
        airdate: '2020-01-01',
        moviedb_id: 2,
        backdrop_slug: null,
        description: null,
        watched: true,
      },
      {
        id: '3',
        tvshow_id: 's',
        season: 1,
        episode: 1,
        name: 'C',
        airdate: '2020-01-01',
        moviedb_id: 3,
        backdrop_slug: null,
        description: null,
        watched: false,
      },
    ];

    const grouped = groupEpisodesBySeason(episodes);
    expect(grouped.map(([season]) => season)).toEqual([1, 2]);
    expect(grouped[0]?.[1].map((ep) => ep.id)).toEqual(['3', '2']);
    expect(grouped[1]?.[1].map((ep) => ep.id)).toEqual(['1']);
  });
});
