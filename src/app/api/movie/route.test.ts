import '@/test/mocks/auth';
import '@/test/mocks/themoviedb';
import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_movies } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet, nextPost } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockGetMovie, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { seedMovie, seedSubscribedMovie, seedUser } from '@/test/seeds';
import { GET, POST } from './route';

describe('/api/movie', () => {
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

  const seedPaged = (i: number) =>
    seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: 998_290 + i, name: `Paged Movie ${i}` } });

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await GET(nextGet(apiRoutes.movie));
      expect(response.status).toBe(401);
    });

    it('returns unwatched subscribed movies', async () => {
      const { movie: unwatched } = await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: 998_201, name: 'Unwatched Movie' },
        watched: false,
      });
      const { movieId: watchedId } = await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: 998_202, name: 'Watched Movie' },
        watched: false,
      });
      await db
        .update(subscribed_movies)
        .set({ watched: true })
        .where(and(eq(subscribed_movies.watcher_id, userId), eq(subscribed_movies.movie_id, watchedId)));

      const response = await GET(nextGet(apiRoutes.movie));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.some((m: { id: string }) => m.id === unwatched.id)).toBe(true);
      expect(data.every((m: { name: string }) => m.name !== 'Watched Movie')).toBe(true);
    });

    describe('pagination', () => {
      it('applies the default page size and reports the total when no params are given', async () => {
        const response = await GET(nextGet(apiRoutes.movie));
        expect(response.status).toBe(200);
        expect(Number(response.headers.get('X-Total-Count'))).toBeGreaterThanOrEqual((await response.json()).length);
      });

      it('pages through results in a stable order and reports the total', async () => {
        for (let i = 1; i <= 3; i++) {
          await seedPaged(i);
        }

        const all = await (await GET(nextGet(apiRoutes.movie))).json();
        const first = await GET(nextGet(apiRoutes.movie, { limit: '2', offset: '0' }));
        const second = await GET(nextGet(apiRoutes.movie, { limit: '2', offset: '2' }));

        expect(Number(first.headers.get('X-Total-Count'))).toBe(all.length);
        const ids = [...(await first.json()), ...(await second.json())].map((r: { id: string }) => r.id);
        expect(ids).toEqual(all.slice(0, 4).map((r: { id: string }) => r.id));
      });

      it('returns an empty page past the end', async () => {
        const response = await GET(nextGet(apiRoutes.movie, { limit: '10', offset: '100000' }));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([]);
        expect(Number(response.headers.get('X-Total-Count'))).toBeGreaterThan(0);
      });

      it.each<Record<string, string>>([{ limit: '0' }, { limit: 'abc' }, { limit: '501' }, { offset: '-1' }])(
        'returns 400 for invalid params %o',
        async (params) => {
          const response = await GET(nextGet(apiRoutes.movie, params));
          expect(response.status).toBe(400);
        },
      );

      it('filters by search across the whole library, not just the first page', async () => {
        await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: 998_300, name: 'Zzyzx Needle Movie' } });
        await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: 998_301, name: 'Other Movie' } });

        const response = await GET(nextGet(apiRoutes.movie, { search: 'zzyzx needle', limit: '1' }));
        const data = await response.json();
        expect(data.map((m: { name: string }) => m.name)).toEqual(['Zzyzx Needle Movie']);
        expect(response.headers.get('X-Total-Count')).toBe('1');
      });

      it('treats LIKE wildcards in search literally', async () => {
        const response = await GET(nextGet(apiRoutes.movie, { search: '%' }));
        expect(await response.json()).toEqual([]);
      });
    });
  });

  describe('POST', () => {
    it('returns 400 when moviedb_id is missing', async () => {
      const response = await POST(nextPost(apiRoutes.movie, {}));
      expect(response.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await POST(nextPost(apiRoutes.movie, { moviedb_id: 1 }));
      expect(response.status).toBe(401);
    });

    it('returns 404 when TMDB has no movie', async () => {
      mockGetMovie.mockResolvedValue(null);
      const response = await POST(nextPost(apiRoutes.movie, { moviedb_id: 998_203 }));
      expect(response.status).toBe(404);
    });

    it('subscribes using an existing movie row', async () => {
      const movie = await seedMovie({ moviedb_id: 998_204, name: 'Existing Row' });
      const response = await POST(nextPost(apiRoutes.movie, { moviedb_id: movie.moviedb_id }));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.movie_id).toBe(movie.id);
      expect(mockGetMovie).not.toHaveBeenCalled();
    });

    it('inserts a new movie from TMDB and subscribes', async () => {
      const moviedbId = 900_000_000 + Math.floor(Math.random() * 1_000_000);
      mockGetMovie.mockResolvedValue({
        id: moviedbId,
        name: 'New From TMDB',
        description: 'Desc',
        poster: '/p.jpg',
        backdrop: '/b.jpg',
        releasedate: '2024-05-01T00:00:00.000Z',
      });
      const response = await POST(nextPost(apiRoutes.movie, { moviedb_id: moviedbId }));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.movie_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(mockGetMovie).toHaveBeenCalledWith(moviedbId);
    });

    it('resets watched to false when re-subscribing', async () => {
      const { movieId } = await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: 998_206, name: 'Re-subscribe' },
        watched: true,
      });
      const response = await POST(nextPost(apiRoutes.movie, { moviedb_id: 998_206 }));
      expect(response.status).toBe(201);

      const [row] = await db
        .select()
        .from(subscribed_movies)
        .where(and(eq(subscribed_movies.watcher_id, userId), eq(subscribed_movies.movie_id, movieId)));
      expect(row?.watched).toBe(false);
    });
  });
});
