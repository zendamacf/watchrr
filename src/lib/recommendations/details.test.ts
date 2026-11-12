import '@/test/mocks/themoviedb';
import { beforeEach, describe, expect, it } from 'vitest';
import type { TMDBTitleDetails } from '@/lib/themoviedb/extras';
import { mockGetMovieDetails, mockGetTvShowDetails, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { getRecommendationDetails, parseRegion, resetRecommendationDetailsCacheForTests } from './details';

const title: TMDBTitleDetails = {
  tagline: 'Tag',
  genres: ['Drama'],
  rating: 8,
  votes: 10,
  runtime: 100,
  seasons: null,
  status: 'Released',
  cast: [{ name: 'A', character: 'B' }],
  trailer: 'key',
  watch: {
    NZ: { link: 'https://tmdb/nz', providers: [{ name: 'Neon', logo: '/neon.jpg' }] },
    US: { link: null, providers: [{ name: 'Netflix', logo: null }] },
  },
};

describe('parseRegion', () => {
  it('uppercases a two-letter code and rejects anything else', () => {
    expect(parseRegion('nz')).toBe('NZ');
    expect(parseRegion('NZL')).toBeNull();
    expect(parseRegion('1a')).toBeNull();
    expect(parseRegion(null)).toBeNull();
  });
});

describe('getRecommendationDetails', () => {
  beforeEach(() => {
    resetThemoviedbMocks();
    resetRecommendationDetailsCacheForTests();
    mockGetMovieDetails.mockResolvedValue(title);
    mockGetTvShowDetails.mockResolvedValue({ ...title, runtime: null, seasons: 3 });
  });

  it('returns the providers for the requested region only', async () => {
    const details = await getRecommendationDetails('movie', 550, 'NZ');

    expect(details.providers).toEqual([{ name: 'Neon', logo: '/neon.jpg' }]);
    expect(details.providers_link).toBe('https://tmdb/nz');
    expect(details).not.toHaveProperty('watch');
    expect(details).toMatchObject({ tagline: 'Tag', rating: 8, trailer: 'key', genres: ['Drama'] });
  });

  it('defaults to the US and returns no providers for an unlisted region', async () => {
    expect((await getRecommendationDetails('movie', 550)).providers).toEqual([{ name: 'Netflix', logo: null }]);
    expect(await getRecommendationDetails('movie', 550, 'FR')).toMatchObject({ providers: [], providers_link: null });
  });

  it('calls TMDB once per title however many regions or users ask', async () => {
    await getRecommendationDetails('movie', 550, 'NZ');
    await getRecommendationDetails('movie', 550, 'US');
    await getRecommendationDetails('movie', 550, 'NZ');

    expect(mockGetMovieDetails).toHaveBeenCalledTimes(1);
  });

  it('keeps movies and shows with the same TMDB id apart', async () => {
    const movie = await getRecommendationDetails('movie', 7);
    const show = await getRecommendationDetails('tvshow', 7);

    expect(movie.runtime).toBe(100);
    expect(show.seasons).toBe(3);
    expect(mockGetTvShowDetails).toHaveBeenCalledWith(7);
  });

  it('does not cache failures', async () => {
    mockGetMovieDetails.mockRejectedValueOnce(new Error('TMDB down'));

    await expect(getRecommendationDetails('movie', 550)).rejects.toThrow('TMDB down');
    await expect(getRecommendationDetails('movie', 550)).resolves.toBeDefined();
  });
});
