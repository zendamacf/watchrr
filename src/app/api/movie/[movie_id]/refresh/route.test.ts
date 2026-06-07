import '@/test/mocks/auth';
import '@/test/mocks/refresher';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ResourceNotFound } from '@/lib/refresher/errors';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextPut, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockRefreshMovie, resetRefresherMocks } from '@/test/mocks/refresher';
import { seedMovie, seedUser } from '@/test/seeds';
import { PUT } from './route';

const unknownId = '00000000-0000-4000-8000-000000000096';

describe('PUT /api/movie/[movie_id]/refresh', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
  });

  beforeEach(() => {
    resetAuthGuardMocks();
    resetRefresherMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  it('returns 400 for a non-UUID movie id', async () => {
    const response = await PUT(nextPut(apiRoutes.movieRefresh('bad')), routeParams({ movie_id: 'bad' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await PUT(nextPut(apiRoutes.movieRefresh(unknownId)), routeParams({ movie_id: unknownId }));
    expect(response.status).toBe(401);
  });

  it('returns 404 when the movie cannot be refreshed', async () => {
    const movie = await seedMovie({ moviedb_id: 998_350, name: 'Missing Refresh' });
    mockRefreshMovie.mockRejectedValue(new ResourceNotFound());
    const response = await PUT(nextPut(apiRoutes.movieRefresh(movie.id)), routeParams({ movie_id: movie.id }));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: 'Could not find movie' });
  });

  it('refreshes the movie by id', async () => {
    const movie = await seedMovie({ moviedb_id: 998_351, name: 'Refresh Target' });
    mockRefreshMovie.mockResolvedValue(undefined);
    const response = await PUT(nextPut(apiRoutes.movieRefresh(movie.id)), routeParams({ movie_id: movie.id }));
    expect(response.status).toBe(200);
    expect(mockRefreshMovie).toHaveBeenCalledWith(movie.id);
  });

  it('rethrows unexpected refresh errors', async () => {
    const movie = await seedMovie({ moviedb_id: 998_352, name: 'Refresh Boom' });
    mockRefreshMovie.mockRejectedValue(new Error('TMDB down'));
    await expect(PUT(nextPut(apiRoutes.movieRefresh(movie.id)), routeParams({ movie_id: movie.id }))).rejects.toThrow(
      'TMDB down',
    );
  });
});
