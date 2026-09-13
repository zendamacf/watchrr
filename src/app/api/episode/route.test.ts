import '@/test/mocks/auth';
import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_tvshows } from '@/lib/db/schema';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedEpisode, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { GET } from './route';

describe('GET /api/episode', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
  });

  beforeEach(() => {
    resetAuthGuardMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('returns unwatched episodes for subscribed shows', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_701, name: 'Episodes Show' },
    });
    await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_702, name: 'Unwatched Ep', season: 1, episode: 1 },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.length).toBeGreaterThan(0);
    expect(data.some((row: { episodes: { name: string } }) => row.episodes.name === 'Unwatched Ep')).toBe(true);
  });

  it('orders episodes by effective airdate including delay_days', async () => {
    const { tvshowId: delayedShowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_710, name: 'Delayed Order Show' },
    });
    const { tvshowId: normalShowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_711, name: 'Normal Order Show' },
    });

    await db
      .update(subscribed_tvshows)
      .set({ delay_days: 14 })
      .where(and(eq(subscribed_tvshows.tvshow_id, delayedShowId), eq(subscribed_tvshows.watcher_id, userId)));

    await seedEpisode({
      tvshowId: delayedShowId,
      overrides: {
        moviedb_id: 998_712,
        name: 'Delayed Order Ep',
        airdate: '2099-09-01',
        season: 1,
        episode: 1,
      },
    });
    await seedEpisode({
      tvshowId: normalShowId,
      overrides: {
        moviedb_id: 998_713,
        name: 'Normal Order Ep',
        airdate: '2099-09-10',
        season: 1,
        episode: 1,
      },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    const names = data.map((row: { episodes: { name: string } }) => row.episodes.name);
    const normalIndex = names.indexOf('Normal Order Ep');
    const delayedIndex = names.indexOf('Delayed Order Ep');

    expect(normalIndex).toBeGreaterThan(-1);
    expect(delayedIndex).toBeGreaterThan(-1);
    expect(normalIndex).toBeLessThan(delayedIndex);
  });
});
