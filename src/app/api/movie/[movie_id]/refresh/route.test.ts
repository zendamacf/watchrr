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

const unknownUuid = '00000000-0000-4000-8000-000000000096';

describe('PUT /api/movie/[movie_id]/refresh', () => {
  beforeEach(async () => {
    resetAuthGuardMocks();
    resetRefresherMocks();
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    mockGuardUser.mockResolvedValue({ id: user.id });
  });

  it('returns 400 for a non-UUID movie id', async () => {
    const response = await PUT(nextPut(apiRoutes.movieRefresh('bad')), routeParams({ movie_id: 'bad' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await PUT(nextPut(apiRoutes.movieRefresh(unknownUuid)), routeParams({ movie_id: unknownUuid }));
    expect(response.status).toBe(401);
  });

  it('returns 404 when the movie cannot be refreshed', async () => {
    const movie = await seedMovie({ moviedb_id: 998_350, name: 'Missing Refresh' });
    mockRefreshMovie.mockRejectedValue(new ResourceNotFound());
    const response = await PUT(nextPut(apiRoutes.movieRefresh(movie.uuid)), routeParams({ movie_id: movie.uuid }));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: 'Could not find movie' });
  });

  it('refreshes the movie by uuid', async () => {
    const movie = await seedMovie({ moviedb_id: 998_351, name: 'Refresh Target' });
    mockRefreshMovie.mockResolvedValue(undefined);
    const response = await PUT(nextPut(apiRoutes.movieRefresh(movie.uuid)), routeParams({ movie_id: movie.uuid }));
    expect(response.status).toBe(200);
    expect(mockRefreshMovie).toHaveBeenCalledWith(movie.uuid);
  });
});
