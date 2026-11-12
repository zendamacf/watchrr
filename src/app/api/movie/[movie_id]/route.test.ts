import '@/test/mocks/auth';
import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { genres, movie_genres, subscribed_movies } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextDelete, nextGet, nextPut, routeParams } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedMovie, seedMovieRecommendation, seedSubscribedMovie, seedUser } from '@/test/seeds';
import { DELETE, GET, PUT } from './route';

const unknownId = '00000000-0000-4000-8000-000000000098';

describe('/api/movie/[movie_id]', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
  });

  beforeEach(() => {
    resetAuthGuardMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  describe('GET', () => {
    it('returns 400 for a non-UUID movie id', async () => {
      const response = await GET(nextGet(apiRoutes.movieById('abc')), routeParams({ movie_id: 'abc' }));
      expect(response.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await GET(nextGet(apiRoutes.movieById(unknownId)), routeParams({ movie_id: unknownId }));
      expect(response.status).toBe(401);
    });

    it('returns 404 when the user is not subscribed to the movie', async () => {
      const movie = await seedMovie({ moviedb_id: 998_310, name: 'Unsubscribed Movie' });
      const response = await GET(nextGet(apiRoutes.movieById(movie.id)), routeParams({ movie_id: movie.id }));
      expect(response.status).toBe(404);
    });

    it('returns the movie, watched state and genres', async () => {
      const { movieId } = await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: 998_311, name: 'Detail Movie' },
        watched: false,
      });
      await db
        .insert(genres)
        .values([
          { id: 990_041, name: 'Test Thriller' },
          { id: 990_042, name: 'Test Comedy' },
        ])
        .onConflictDoNothing();
      await db
        .insert(movie_genres)
        .values([
          { movie_id: movieId, genre_id: 990_041 },
          { movie_id: movieId, genre_id: 990_042 },
        ])
        .onConflictDoNothing();

      const response = await GET(nextGet(apiRoutes.movieById(movieId)), routeParams({ movie_id: movieId }));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.movie).toMatchObject({ id: movieId, name: 'Detail Movie' });
      expect(body.subscription).toEqual({ watched: false, watched_at: null });
      expect(body.genres).toEqual(['Test Comedy', 'Test Thriller']);
      expect(body.similar).toEqual([]);
    });

    it('returns similar movies from cached recommendations', async () => {
      const { movieId } = await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: 998_312, name: 'Has Similar' },
      });
      await seedMovieRecommendation({ sourceMovieId: movieId, moviedb_id: 998_313, name: 'Alike' });

      const response = await GET(nextGet(apiRoutes.movieById(movieId)), routeParams({ movie_id: movieId }));
      const body = await response.json();
      expect(body.similar).toEqual([
        { moviedb_id: 998_313, name: 'Alike', releasedate: '2021-06-01', poster_slug: '/rec-poster.jpg' },
      ]);
    });
  });

  describe('PUT', () => {
    it('returns 400 for a non-UUID movie id', async () => {
      const response = await PUT(nextPut(apiRoutes.movieById('abc')), routeParams({ movie_id: 'abc' }));
      expect(response.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await PUT(nextPut(apiRoutes.movieById(unknownId)), routeParams({ movie_id: unknownId }));
      expect(response.status).toBe(401);
    });

    it('marks a subscribed movie as watched by id', async () => {
      const { movieId } = await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: 998_301, name: 'Watch Me' },
        watched: false,
      });
      const response = await PUT(nextPut(apiRoutes.movieById(movieId)), routeParams({ movie_id: movieId }));
      expect(response.status).toBe(200);

      const [row] = await db
        .select()
        .from(subscribed_movies)
        .where(and(eq(subscribed_movies.watcher_id, userId), eq(subscribed_movies.movie_id, movieId)));
      expect(row?.watched).toBe(true);
      expect(row?.watched_at).toBeInstanceOf(Date);
    });

    it('keeps the original watched time when marked watched again', async () => {
      const { movieId } = await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: 998_302, name: 'Watch Me Twice' },
        watched: false,
      });
      const params = routeParams({ movie_id: movieId });
      await PUT(nextPut(apiRoutes.movieById(movieId)), params);
      const where = and(eq(subscribed_movies.watcher_id, userId), eq(subscribed_movies.movie_id, movieId));
      const [first] = await db.select().from(subscribed_movies).where(where);
      await PUT(nextPut(apiRoutes.movieById(movieId)), params);
      const [second] = await db.select().from(subscribed_movies).where(where);

      expect(first?.watched_at).toBeInstanceOf(Date);
      expect(second?.watched_at?.getTime()).toBe(first?.watched_at?.getTime());
    });
  });

  describe('DELETE', () => {
    it('returns 400 for a non-UUID movie id', async () => {
      const response = await DELETE(nextDelete(apiRoutes.movieById('nope')), routeParams({ movie_id: 'nope' }));
      expect(response.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await DELETE(nextDelete(apiRoutes.movieById(unknownId)), routeParams({ movie_id: unknownId }));
      expect(response.status).toBe(401);
    });

    it('removes the subscription by id', async () => {
      const { movieId } = await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: 998_304, name: 'Unsubscribe Me' },
      });
      const response = await DELETE(nextDelete(apiRoutes.movieById(movieId)), routeParams({ movie_id: movieId }));
      expect(response.status).toBe(200);

      const rows = await db
        .select()
        .from(subscribed_movies)
        .where(and(eq(subscribed_movies.watcher_id, userId), eq(subscribed_movies.movie_id, movieId)));
      expect(rows).toHaveLength(0);
    });
  });
});
