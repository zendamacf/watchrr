import '@/test/mocks/auth';
import '@/test/mocks/themoviedb';
import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_tvshows } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet, nextPost } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockGetTvShow, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { seedSubscribedTvShow, seedTvShow, seedUser } from '@/test/seeds';
import { GET, POST } from './route';

describe('/api/tvshow', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
  });

  beforeEach(() => {
    resetAuthGuardMocks();
    resetThemoviedbMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await GET(nextGet(apiRoutes.tvshow));
      expect(response.status).toBe(401);
    });

    it('returns subscribed shows', async () => {
      const { show } = await seedSubscribedTvShow({
        watcherId: userId,
        show: { moviedb_id: 998_601, name: 'My Show' },
      });
      const response = await GET(nextGet(apiRoutes.tvshow));
      expect(response.status).toBe(200);
      const data = await response.json();
      const match = data.find((s: { id: string }) => s.id === show.id);
      expect(match).toBeDefined();
      expect(match.delay_days).toBe(0);
      expect(match.snoozed_until).toBeNull();
    });

    describe('pagination', () => {
      it('applies the default page size and reports the total when no params are given', async () => {
        const response = await GET(nextGet(apiRoutes.tvshow));
        expect(response.status).toBe(200);
        expect(Number(response.headers.get('X-Total-Count'))).toBeGreaterThanOrEqual((await response.json()).length);
      });

      it('pages through results in a stable order and reports the total', async () => {
        // Dedicated user: other test files insert subscriptions for apiUser in parallel,
        // which made the exact-total assertion below flaky.
        const pagingUser = await seedUser({ email: seedEmails.tvshowPagination, password: seedPassword });
        mockGuardUser.mockResolvedValue({ id: pagingUser.id });
        for (let i = 1; i <= 3; i++) {
          await seedSubscribedTvShow({
            watcherId: pagingUser.id,
            show: { moviedb_id: 998_690 + i, name: `Paged Show ${i}` },
          });
        }

        const all = await (await GET(nextGet(apiRoutes.tvshow))).json();
        const first = await GET(nextGet(apiRoutes.tvshow, { limit: '2', offset: '0' }));
        const second = await GET(nextGet(apiRoutes.tvshow, { limit: '2', offset: '2' }));

        expect(Number(first.headers.get('X-Total-Count'))).toBe(all.length);
        const ids = [...(await first.json()), ...(await second.json())].map((r: { id: string }) => r.id);
        expect(ids).toEqual(all.slice(0, 4).map((r: { id: string }) => r.id));
      });

      it('returns an empty page past the end', async () => {
        const response = await GET(nextGet(apiRoutes.tvshow, { limit: '10', offset: '100000' }));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([]);
        expect(Number(response.headers.get('X-Total-Count'))).toBeGreaterThan(0);
      });

      it.each<Record<string, string>>([{ limit: '0' }, { limit: 'abc' }, { limit: '501' }, { offset: '-1' }])(
        'returns 400 for invalid params %o',
        async (params) => {
          const response = await GET(nextGet(apiRoutes.tvshow, params));
          expect(response.status).toBe(400);
        },
      );

      it('filters by search across the whole library, not just the first page', async () => {
        await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: 998_650, name: 'Zzyzx Needle Show' } });

        const response = await GET(nextGet(apiRoutes.tvshow, { search: 'zzyzx needle', limit: '1' }));
        const data = await response.json();
        expect(data.map((s: { name: string }) => s.name)).toEqual(['Zzyzx Needle Show']);
        expect(response.headers.get('X-Total-Count')).toBe('1');
      });

      it('filters by status', async () => {
        await seedSubscribedTvShow({
          watcherId: userId,
          show: { moviedb_id: 998_651, name: 'Ended Status Show', status: 'Ended' },
        });
        await seedSubscribedTvShow({
          watcherId: userId,
          show: { moviedb_id: 998_652, name: 'Unknown Status Show', status: '' },
        });

        const ended = await (await GET(nextGet(apiRoutes.tvshow, { status: 'Ended' }))).json();
        expect(ended.length).toBeGreaterThan(0);
        expect(ended.every((s: { status: string }) => s.status === 'Ended')).toBe(true);

        const unknown = await (await GET(nextGet(apiRoutes.tvshow, { status: 'unknown' }))).json();
        expect(unknown.some((s: { name: string }) => s.name === 'Unknown Status Show')).toBe(true);
        expect(unknown.every((s: { status: string | null }) => !s.status)).toBe(true);
      });

      it('returns 400 for an invalid status', async () => {
        const response = await GET(nextGet(apiRoutes.tvshow, { status: 'Bogus' }));
        expect(response.status).toBe(400);
      });
    });
  });

  describe('POST', () => {
    it('returns 400 when moviedb_id is missing', async () => {
      const response = await POST(nextPost(apiRoutes.tvshow, {}));
      expect(response.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await POST(nextPost(apiRoutes.tvshow, { moviedb_id: 1 }));
      expect(response.status).toBe(401);
    });

    it('returns 404 when TMDB has no show', async () => {
      mockGetTvShow.mockResolvedValue(null);
      const response = await POST(nextPost(apiRoutes.tvshow, { moviedb_id: 998_602 }));
      expect(response.status).toBe(404);
    });

    it('subscribes using an existing show row', async () => {
      const show = await seedTvShow({ moviedb_id: 998_603, name: 'Existing Show' });
      const response = await POST(nextPost(apiRoutes.tvshow, { moviedb_id: show.moviedb_id }));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.tvshow_id).toBe(show.id);
      expect(mockGetTvShow).not.toHaveBeenCalled();
    });

    it('inserts a new show from TMDB and subscribes', async () => {
      const moviedbId = 910_000_000 + Math.floor(Math.random() * 1_000_000);
      mockGetTvShow.mockResolvedValue({
        id: moviedbId,
        name: 'New Show',
        description: 'Overview',
        country: 'US',
        firstAirDate: '2020-01-01T00:00:00.000Z',
        poster: '/p.jpg',
        backdrop: '/b.jpg',
      });
      const response = await POST(nextPost(apiRoutes.tvshow, { moviedb_id: moviedbId }));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(mockGetTvShow).toHaveBeenCalledWith(moviedbId);

      const [row] = await db
        .select()
        .from(subscribed_tvshows)
        .where(and(eq(subscribed_tvshows.watcher_id, userId), eq(subscribed_tvshows.tvshow_id, body.tvshow_id)));
      expect(row).toBeDefined();
    });
  });
});
