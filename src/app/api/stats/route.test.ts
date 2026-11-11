import '@/test/mocks/auth';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { watched_episodes } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedEpisode, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { GET } from './route';

describe('GET /api/stats', () => {
  let userId: string;
  let otherId: string;

  beforeAll(async () => {
    userId = (await seedUser({ email: seedEmails.statsRoute, password: seedPassword })).id;
    otherId = (await seedUser({ email: seedEmails.statsOther, password: seedPassword })).id;
  });

  beforeEach(async () => {
    resetAuthGuardMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
    await db.delete(watched_episodes).where(eq(watched_episodes.watcher_id, userId));
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    expect((await GET(nextGet(apiRoutes.stats()))).status).toBe(401);
  });

  it('returns 400 for invalid params', async () => {
    const response = await GET(nextGet('/api/stats', { from: 'nope' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Invalid from' });
  });

  it('returns an empty-state payload for a user with no history', async () => {
    const response = await GET(nextGet(apiRoutes.stats(), { tz: 'UTC' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.episodes.total).toBe(0);
    expect(body.movies.total).toBe(0);
    expect(body.timezone).toBe('UTC');
    expect(body.genres).toEqual([]);
  });

  it("only counts the signed-in user's watches", async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 997_401, name: 'Route Show' },
    });
    const ep = await seedEpisode({ tvshowId, overrides: { moviedb_id: 997_402, airdate: '2026-01-01' } });
    await db.insert(watched_episodes).values({ episode_id: ep.id, watcher_id: userId, watched_at: new Date() });
    await db
      .insert(watched_episodes)
      .values({ episode_id: ep.id, watcher_id: otherId, watched_at: new Date() })
      .onConflictDoNothing();

    const body = await (await GET(nextGet(apiRoutes.stats()))).json();
    expect(body.episodes.total).toBe(1);
    expect(body.genres).toEqual([{ id: null, name: 'Unknown', episodes: 1, movies: 0, minutes: 45 }]);
  });
});
