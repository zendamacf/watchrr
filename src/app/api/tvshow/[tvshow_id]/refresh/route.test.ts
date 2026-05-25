import '@/test/mocks/auth';
import '@/test/mocks/refresher';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResourceNotFound } from '@/lib/refresher/errors';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextPut, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockRefreshTvShow, resetRefresherMocks } from '@/test/mocks/refresher';
import { seedTvShow, seedUser } from '@/test/seeds';
import { PUT } from './route';

const unknownUuid = '00000000-0000-4000-8000-000000000097';

describe('PUT /api/tvshow/[tvshow_id]/refresh', () => {
  beforeEach(async () => {
    resetAuthGuardMocks();
    resetRefresherMocks();
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    mockGuardUser.mockResolvedValue({ id: user.id });
  });

  it('returns 400 for a non-UUID tvshow id', async () => {
    const response = await PUT(nextPut(apiRoutes.tvshowRefresh('bad')), routeParams({ tvshow_id: 'bad' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await PUT(nextPut(apiRoutes.tvshowRefresh(unknownUuid)), routeParams({ tvshow_id: unknownUuid }));
    expect(response.status).toBe(401);
  });

  it('returns 404 when the show cannot be refreshed', async () => {
    const show = await seedTvShow({ moviedb_id: 998_450, name: 'Missing Refresh' });
    mockRefreshTvShow.mockRejectedValue(new ResourceNotFound());
    const response = await PUT(nextPut(apiRoutes.tvshowRefresh(show.uuid)), routeParams({ tvshow_id: show.uuid }));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: 'Could not find show' });
  });

  it('refreshes the show by uuid', async () => {
    const show = await seedTvShow({ moviedb_id: 998_451, name: 'Refresh Show' });
    mockRefreshTvShow.mockResolvedValue(undefined);
    const response = await PUT(nextPut(apiRoutes.tvshowRefresh(show.uuid)), routeParams({ tvshow_id: show.uuid }));
    expect(response.status).toBe(200);
    expect(mockRefreshTvShow).toHaveBeenCalledWith(show.uuid);
  });
});
