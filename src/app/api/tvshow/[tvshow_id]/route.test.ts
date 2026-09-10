import '@/test/mocks/auth';
import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_tvshows } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextDelete, nextPatch, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { DELETE, PATCH } from './route';

const unknownId = '00000000-0000-4000-8000-000000000099';

describe('DELETE /api/tvshow/[tvshow_id]', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
  });

  beforeEach(() => {
    resetAuthGuardMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  it('returns 400 for a non-UUID tvshow id', async () => {
    const response = await DELETE(nextDelete(apiRoutes.tvshowById('bad')), routeParams({ tvshow_id: 'bad' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await DELETE(nextDelete(apiRoutes.tvshowById(unknownId)), routeParams({ tvshow_id: unknownId }));
    expect(response.status).toBe(401);
  });

  it('updates subscription preferences', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_402, name: 'Prefs Show' },
    });

    const response = await PATCH(
      nextPatch(apiRoutes.tvshowById(tvshowId), { delay_days: 14, snoozed_until: '2099-01-01' }),
      routeParams({ tvshow_id: tvshowId }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.delay_days).toBe(14);
    expect(body.snoozed_until).toBe('2099-01-01');

    const rows = await db
      .select()
      .from(subscribed_tvshows)
      .where(and(eq(subscribed_tvshows.watcher_id, userId), eq(subscribed_tvshows.tvshow_id, tvshowId)));
    expect(rows[0]?.delay_days).toBe(14);
    expect(rows[0]?.snoozed_until).toBe('2099-01-01');
  });

  it('returns 400 for invalid preferences', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_403, name: 'Invalid Prefs Show' },
    });

    const response = await PATCH(
      nextPatch(apiRoutes.tvshowById(tvshowId), { delay_days: 999 }),
      routeParams({ tvshow_id: tvshowId }),
    );
    expect(response.status).toBe(400);
  });

  it('removes the subscription by id', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_401, name: 'Drop Show' },
    });
    const response = await DELETE(nextDelete(apiRoutes.tvshowById(tvshowId)), routeParams({ tvshow_id: tvshowId }));
    expect(response.status).toBe(200);

    const rows = await db
      .select()
      .from(subscribed_tvshows)
      .where(and(eq(subscribed_tvshows.watcher_id, userId), eq(subscribed_tvshows.tvshow_id, tvshowId)));
    expect(rows).toHaveLength(0);
  });
});
