import '@/test/mocks/auth';
import '@/test/mocks/themoviedb';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetRecommendationDetailsCacheForTests } from '@/lib/recommendations/details';
import { apiRoutes } from '@/lib/routes';
import { nextGet } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockGetMovieDetails, mockGetTvShowDetails, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { GET } from './route';

const title = {
  tagline: null,
  genres: ['Drama'],
  rating: 7.5,
  votes: 3,
  runtime: 90,
  seasons: null,
  status: null,
  cast: [],
  trailer: null,
  watch: { NZ: { link: 'https://tmdb/nz', providers: [{ name: 'Neon', logo: null }] } },
};

const get = (search: Record<string, string>) => GET(nextGet(apiRoutes.recommendationDetails(''), search));

describe('GET /api/recommendations/details', () => {
  beforeEach(() => {
    resetAuthGuardMocks();
    resetThemoviedbMocks();
    resetRecommendationDetailsCacheForTests();
    mockGuardUser.mockResolvedValue({ id: 'user-1' });
    mockGetMovieDetails.mockResolvedValue(title);
    mockGetTvShowDetails.mockResolvedValue({ ...title, seasons: 2 });
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    expect((await get({ type: 'movie', moviedb_id: '1' })).status).toBe(401);
    expect(mockGetMovieDetails).not.toHaveBeenCalled();
  });

  it.each([
    ['missing type', { moviedb_id: '1' }],
    ['unknown type', { type: 'book', moviedb_id: '1' }],
    ['missing id', { type: 'movie' }],
    ['non-numeric id', { type: 'movie', moviedb_id: 'abc' }],
    ['zero id', { type: 'movie', moviedb_id: '0' }],
    ['bad region', { type: 'movie', moviedb_id: '1', region: 'NZL' }],
    ['empty region', { type: 'movie', moviedb_id: '1', region: '' }],
  ])('returns 400 for %s', async (_name, search) => {
    expect((await get(search)).status).toBe(400);
    expect(mockGetMovieDetails).not.toHaveBeenCalled();
  });

  it('returns movie details with providers for the region and a private cache header', async () => {
    const response = await get({ type: 'movie', moviedb_id: '550', region: 'nz' });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
    expect(await response.json()).toMatchObject({
      genres: ['Drama'],
      rating: 7.5,
      providers: [{ name: 'Neon', logo: null }],
      providers_link: 'https://tmdb/nz',
    });
    expect(mockGetMovieDetails).toHaveBeenCalledWith(550);
  });

  it('returns show details and defaults the region', async () => {
    const response = await get({ type: 'tvshow', moviedb_id: '1396' });

    expect(await response.json()).toMatchObject({ seasons: 2, providers: [] });
    expect(mockGetTvShowDetails).toHaveBeenCalledWith(1396);
  });

  it('returns 502 when TMDB fails', async () => {
    mockGetMovieDetails.mockRejectedValue(new Error('nope'));

    const response = await get({ type: 'movie', moviedb_id: '550' });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: 'Could not load details from TMDB' });
  });
});
