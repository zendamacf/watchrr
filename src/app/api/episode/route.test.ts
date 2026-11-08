import '@/test/mocks/auth';
import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_tvshows } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet } from '@/test/helpers/api-request';
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
    const response = await GET(nextGet(apiRoutes.episode));
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

    const response = await GET(nextGet(apiRoutes.episode));
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

    const response = await GET(nextGet(apiRoutes.episode));
    expect(response.status).toBe(200);
    const data = await response.json();
    const names = data.map((row: { episodes: { name: string } }) => row.episodes.name);
    const normalIndex = names.indexOf('Normal Order Ep');
    const delayedIndex = names.indexOf('Delayed Order Ep');

    expect(normalIndex).toBeGreaterThan(-1);
    expect(delayedIndex).toBeGreaterThan(-1);
    expect(normalIndex).toBeLessThan(delayedIndex);
  });

  describe('pagination', () => {
    it('applies the default page size and reports the total when no params are given', async () => {
      const response = await GET(nextGet(apiRoutes.episode));
      expect(response.status).toBe(200);
      expect(Number(response.headers.get('X-Total-Count'))).toBeGreaterThanOrEqual((await response.json()).length);
    });

    it('pages through results with stable order and reports the total', async () => {
      const { tvshowId } = await seedSubscribedTvShow({
        watcherId: userId,
        show: { moviedb_id: 998_790, name: 'Paged Episodes Show' },
      });
      for (let i = 1; i <= 3; i++) {
        await seedEpisode({
          tvshowId,
          overrides: { moviedb_id: 998_790 + i, name: `Paged Ep ${i}`, season: 1, episode: i },
        });
      }

      const all = await (await GET(nextGet(apiRoutes.episode))).json();
      const first = await GET(nextGet(apiRoutes.episode, { limit: '2', offset: '0' }));
      const second = await GET(nextGet(apiRoutes.episode, { limit: '2', offset: '2' }));

      const total = Number(first.headers.get('X-Total-Count'));
      expect(total).toBe(all.length);
      const ids = [...(await first.json()), ...(await second.json())].map((r) => r.episodes.id);
      expect(ids).toEqual(all.slice(0, 4).map((r: { episodes: { id: string } }) => r.episodes.id));
    });

    it('returns an empty page past the end', async () => {
      const response = await GET(nextGet(apiRoutes.episode, { limit: '10', offset: '100000' }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
      expect(Number(response.headers.get('X-Total-Count'))).toBeGreaterThan(0);
    });

    it.each<Record<string, string>>([
      { limit: '0' },
      { limit: '-1' },
      { limit: 'abc' },
      { limit: '501' },
      { offset: '-1' },
      { offset: '1.5' },
    ])('returns 400 for invalid params %o', async (params) => {
      const response = await GET(nextGet(apiRoutes.episode, params));
      expect(response.status).toBe(400);
    });

    it('filters by search across the whole list, not just the first page', async () => {
      const { tvshowId } = await seedSubscribedTvShow({
        watcherId: userId,
        show: { moviedb_id: 998_760, name: 'Search Target Show' },
      });
      await seedEpisode({
        tvshowId,
        overrides: { moviedb_id: 998_761, name: 'Zzyzx Needle Episode', season: 1, episode: 1 },
      });

      const response = await GET(nextGet(apiRoutes.episode, { search: 'zzyzx needle', limit: '1' }));
      const data = await response.json();
      expect(data.map((r: { episodes: { name: string } }) => r.episodes.name)).toEqual(['Zzyzx Needle Episode']);
      expect(response.headers.get('X-Total-Count')).toBe('1');

      const byShow = await (await GET(nextGet(apiRoutes.episode, { search: 'search target show' }))).json();
      expect(byShow.length).toBeGreaterThan(0);
    });

    it('splits snoozed and scheduled episodes with the snoozed param', async () => {
      const { tvshowId } = await seedSubscribedTvShow({
        watcherId: userId,
        show: { moviedb_id: 998_770, name: 'Snoozed Filter Show' },
      });
      await seedEpisode({
        tvshowId,
        overrides: { moviedb_id: 998_771, name: 'Snoozed Filter Ep', season: 1, episode: 1 },
      });
      await db
        .update(subscribed_tvshows)
        .set({ snoozed_until: '2099-01-01' })
        .where(and(eq(subscribed_tvshows.tvshow_id, tvshowId), eq(subscribed_tvshows.watcher_id, userId)));

      const names = async (snoozed?: string) =>
        (await (await GET(nextGet(apiRoutes.episode, snoozed ? { snoozed } : undefined))).json()).map(
          (r: { episodes: { name: string } }) => r.episodes.name,
        );

      expect(await names('true')).toContain('Snoozed Filter Ep');
      expect(await names('false')).not.toContain('Snoozed Filter Ep');
      expect(await names()).toContain('Snoozed Filter Ep');
    });

    it('returns 400 for an invalid snoozed value', async () => {
      const response = await GET(nextGet(apiRoutes.episode, { snoozed: 'maybe' }));
      expect(response.status).toBe(400);
    });
  });
});
