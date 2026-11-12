import { describe, expect, it } from 'vitest';
import { CAST_LIMIT, mapExtras } from './extras';

describe('mapExtras', () => {
  it('returns empty extras when nothing was appended', () => {
    expect(mapExtras({})).toEqual({ cast: [], trailer: null, watch: {} });
  });

  it('keeps the first cast members in billing order and blanks empty characters', () => {
    const cast = Array.from({ length: CAST_LIMIT + 3 }, (_, i) => ({
      name: `Actor ${i}`,
      character: i ? `Role ${i}` : ' ',
    }));
    const result = mapExtras({ credits: { cast } });

    expect(result.cast).toHaveLength(CAST_LIMIT);
    expect(result.cast[0]).toEqual({ name: 'Actor 0', character: null });
    expect(result.cast[1]).toEqual({ name: 'Actor 1', character: 'Role 1' });
  });

  it('prefers an official YouTube trailer', () => {
    const videos = {
      results: [
        { key: 'teaser', site: 'YouTube', type: 'Teaser', official: true },
        { key: 'vimeo', site: 'Vimeo', type: 'Trailer', official: true },
        { key: 'fan', site: 'YouTube', type: 'Trailer', official: false },
        { key: 'real', site: 'YouTube', type: 'Trailer', official: true },
      ],
    };
    expect(mapExtras({ videos }).trailer).toBe('real');
  });

  it('falls back to an unofficial trailer, and to none', () => {
    const fan = { key: 'fan', site: 'YouTube', type: 'Trailer' };
    expect(mapExtras({ videos: { results: [fan] } }).trailer).toBe('fan');
    expect(mapExtras({ videos: { results: [{ ...fan, type: 'Clip' }] } }).trailer).toBeNull();
  });

  it('keeps only regions with subscription providers', () => {
    const results = {
      NZ: {
        link: 'https://tmdb/nz',
        flatrate: [{ provider_name: 'Netflix', logo_path: '/n.jpg' }, { provider_name: 'Neon' }],
      },
      US: { link: 'https://tmdb/us', rent: [{ provider_name: 'Apple TV' }] },
      GB: undefined,
      AU: { flatrate: [{ provider_name: 'Stan', logo_path: null }] },
    };

    expect(mapExtras({ 'watch/providers': { results } }).watch).toEqual({
      NZ: {
        link: 'https://tmdb/nz',
        providers: [
          { name: 'Netflix', logo: '/n.jpg' },
          { name: 'Neon', logo: null },
        ],
      },
      AU: { link: null, providers: [{ name: 'Stan', logo: null }] },
    });
  });
});
