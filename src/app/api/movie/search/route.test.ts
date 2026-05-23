import '@/test/mocks/auth';
import '@/test/mocks/themoviedb';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockSearchMovies, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { seedUser } from '@/test/seeds';
import { GET } from './route';

describe('GET /api/movie/search', () => {
  beforeEach(async () => {
    resetAuthGuardMocks();
    resetThemoviedbMocks();
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    mockGuardUser.mockResolvedValue({ id: user.id });
  });

  it('returns an empty array when q is missing or blank', async () => {
    const empty = await GET(nextGet(apiRoutes.movieSearch('')));
    expect(empty.status).toBe(200);
    await expect(empty.json()).resolves.toEqual([]);

    const whitespace = await GET(nextGet(apiRoutes.movieSearch('q=   ')));
    expect(whitespace.status).toBe(200);
    await expect(whitespace.json()).resolves.toEqual([]);
    expect(mockSearchMovies).not.toHaveBeenCalled();
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await GET(nextGet(apiRoutes.movieSearch('q=inception')));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Unauthorized' });
  });

  it('returns search results from TMDB', async () => {
    const results = [{ id: 1, name: 'Inception', description: '', poster: null, backdrop: null, releasedate: '' }];
    mockSearchMovies.mockResolvedValue(results);
    const response = await GET(nextGet(apiRoutes.movieSearch('q=inception')));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(results);
    expect(mockSearchMovies).toHaveBeenCalledWith('inception');
  });
});
