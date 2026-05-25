import '@/test/mocks/auth';
import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_tvshows } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextDelete, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { DELETE } from './route';

const unknownUuid = '00000000-0000-4000-8000-000000000099';

describe('DELETE /api/tvshow/[tvshow_id]', () => {
  let userId: string;

  beforeEach(async () => {
    resetAuthGuardMocks();
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  it('returns 400 for a non-UUID tvshow id', async () => {
    const response = await DELETE(nextDelete(apiRoutes.tvshowById('bad')), routeParams({ tvshow_id: 'bad' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await DELETE(
      nextDelete(apiRoutes.tvshowById(unknownUuid)),
      routeParams({ tvshow_id: unknownUuid }),
    );
    expect(response.status).toBe(401);
  });

  it('removes the subscription by uuid', async () => {
    const { tvshowUuid } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_401, name: 'Drop Show' },
    });
    const response = await DELETE(nextDelete(apiRoutes.tvshowById(tvshowUuid)), routeParams({ tvshow_id: tvshowUuid }));
    expect(response.status).toBe(200);

    const rows = await db
      .select()
      .from(subscribed_tvshows)
      .where(and(eq(subscribed_tvshows.watcher_id, userId), eq(subscribed_tvshows.tvshow_uuid, tvshowUuid)));
    expect(rows).toHaveLength(0);
  });
});
