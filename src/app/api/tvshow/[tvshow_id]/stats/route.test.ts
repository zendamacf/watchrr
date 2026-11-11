import '@/test/mocks/auth';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedEpisode, seedSubscribedTvShow, seedTvShow, seedUser } from '@/test/seeds';
import { GET } from './route';

const unknownId = '00000000-0000-4000-8000-000000000096';

describe('GET /api/tvshow/[tvshow_id]/stats', () => {
  let userId: string;

  beforeAll(async () => {
    userId = (await seedUser({ email: seedEmails.statsRoute, password: seedPassword })).id;
  });

  beforeEach(() => {
    resetAuthGuardMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  const call = (id: string, search?: Record<string, string>) =>
    GET(nextGet(apiRoutes.tvshowStats(id), search), routeParams({ tvshow_id: id }));

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    expect((await call(unknownId)).status).toBe(401);
  });

  it('returns 400 for a non-UUID id', async () => {
    expect((await call('x')).status).toBe(400);
  });

  it('returns 400 for an invalid timezone', async () => {
    expect((await call(unknownId, { tz: 'Nope/Nope' })).status).toBe(400);
  });

  it('returns 404 for an unknown or unsubscribed show', async () => {
    expect((await call(unknownId)).status).toBe(404);
    const other = await seedTvShow({ moviedb_id: 997_501, name: 'Not Subscribed' });
    expect((await call(other.id)).status).toBe(404);
  });

  it('returns stats for a subscribed show', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 997_502, name: 'Subscribed Route Show' },
    });
    await seedEpisode({ tvshowId, overrides: { moviedb_id: 997_503, airdate: '2026-01-01', runtime: 20 } });
    const response = await call(tvshowId);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ watched: 0, aired: 1, backlog: 1, backlogMinutes: 20 });
  });
});
