import '@/test/mocks/auth';
import '@/test/mocks/refresher';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResourceNotFound } from '@/lib/refresher/errors';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextPut, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockRefreshMovie, resetRefresherMocks } from '@/test/mocks/refresher';
import { seedMovie, seedUser } from '@/test/seeds';
import { PUT } from './route';

describe('PUT /api/movie/[movie_id]/refresh', () => {
  beforeEach(async () => {
    resetAuthGuardMocks();
    resetRefresherMocks();
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    mockGuardUser.mockResolvedValue({ id: user.id });
  });

  it('returns 400 for an invalid movie id', async () => {
    const response = await PUT(nextPut(apiRoutes.movieRefresh('bad')), routeParams({ movie_id: 'bad' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await PUT(nextPut(apiRoutes.movieRefresh(1)), routeParams({ movie_id: '1' }));
    expect(response.status).toBe(401);
  });

  it('returns 404 when the movie cannot be refreshed', async () => {
    const movie = await seedMovie({ moviedb_id: 998_350, name: 'Missing Refresh' });
    mockRefreshMovie.mockRejectedValue(new ResourceNotFound());
    const response = await PUT(nextPut(apiRoutes.movieRefresh(movie.id)), routeParams({ movie_id: String(movie.id) }));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: 'Could not find movie' });
  });

  it('refreshes the movie by legacy numeric id', async () => {
    const movie = await seedMovie({ moviedb_id: 998_351, name: 'Refresh Target' });
    mockRefreshMovie.mockResolvedValue(undefined);
    const response = await PUT(nextPut(apiRoutes.movieRefresh(movie.id)), routeParams({ movie_id: String(movie.id) }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: 'Success' });
    expect(mockRefreshMovie).toHaveBeenCalledWith(movie.uuid);
  });

  it('refreshes the movie by uuid', async () => {
    const movie = await seedMovie({ moviedb_id: 998_352, name: 'Refresh Target UUID' });
    mockRefreshMovie.mockResolvedValue(undefined);
    const response = await PUT(nextPut(apiRoutes.movieRefresh(movie.uuid)), routeParams({ movie_id: movie.uuid }));
    expect(response.status).toBe(200);
    expect(mockRefreshMovie).toHaveBeenCalledWith(movie.uuid);
  });
});
