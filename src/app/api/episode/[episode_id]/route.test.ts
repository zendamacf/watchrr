import '@/test/mocks/auth';
import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { watched_episodes } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextPut, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedEpisode, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { PUT } from './route';

const unknownId = '00000000-0000-4000-8000-000000000095';

describe('PUT /api/episode/[episode_id]', () => {
  let userId: string;

  beforeEach(async () => {
    resetAuthGuardMocks();
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  it('returns 400 for a non-UUID episode id', async () => {
    const response = await PUT(nextPut(apiRoutes.episodeById('x')), routeParams({ episode_id: 'x' }));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await PUT(nextPut(apiRoutes.episodeById(unknownId)), routeParams({ episode_id: unknownId }));
    expect(response.status).toBe(401);
  });

  it('marks an episode as watched by id', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_501, name: 'Episode Show' },
    });
    const episode = await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_502, name: 'Ep to watch' },
    });

    const response = await PUT(nextPut(apiRoutes.episodeById(episode.id)), routeParams({ episode_id: episode.id }));
    expect(response.status).toBe(200);

    const [row] = await db
      .select()
      .from(watched_episodes)
      .where(and(eq(watched_episodes.watcher_id, userId), eq(watched_episodes.episode_id, episode.id)));
    expect(row).toBeDefined();
  });
});
