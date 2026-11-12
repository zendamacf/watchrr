import '@/test/mocks/themoviedb';

const mockLoggerWarn = vi.hoisted(() => vi.fn());

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: mockLoggerWarn, error: vi.fn() },
}));

import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { movie_recommendations, movies, tvshow_recommendations, tvshows } from '@/lib/db/schema';
import {
  mockGetMovieRecommendations,
  mockGetTvShowRecommendations,
  resetThemoviedbMocks,
} from '@/test/mocks/themoviedb';
import { seedMovie, seedSubscribedMovie, seedSubscribedTvShow, seedTvShow, seedUser } from '@/test/seeds';
import { ResourceNotFound } from './errors';
import {
  cacheMovieRecommendationsIfMissing,
  cacheTvShowRecommendationsIfMissing,
  getRecommendationsStaleBefore,
  listMoviesNeedingRecommendations,
  listShowsNeedingRecommendations,
  refreshMovieRecommendations,
  refreshTvShowRecommendations,
} from './recommendations';

const MOVIE_BASE = 961_000;
const SHOW_BASE = 962_000;

const tmdbMovie = (id: number, name = `Rec ${id}`) => ({
  id,
  name,
  description: 'desc',
  poster: '/p.jpg',
  backdrop: null,
  releasedate: '2020-05-01T00:00:00.000Z',
  runtime: null,
  genres: [],
});

const tmdbShow = (id: number, name = `Rec ${id}`) => ({
  id,
  name,
  description: 'desc',
  country: 'US',
  firstAirDate: '2020-05-01T00:00:00.000Z',
  poster: '/p.jpg',
  backdrop: null,
  status: null,
  genres: [],
});

describe('recommendations refresher', () => {
  beforeEach(() => {
    resetThemoviedbMocks();
    mockLoggerWarn.mockClear();
  });

  it('getRecommendationsStaleBefore is seven days back', () => {
    const now = DateTime.utc(2026, 1, 8);
    expect(getRecommendationsStaleBefore(now)).toEqual(DateTime.utc(2026, 1, 1).toJSDate());
  });

  describe('refreshMovieRecommendations', () => {
    it('throws ResourceNotFound for an unknown movie', async () => {
      await expect(refreshMovieRecommendations('00000000-0000-4000-8000-0000000000ff')).rejects.toBeInstanceOf(
        ResourceNotFound,
      );
    });

    it('caches recommendations, drops duplicates and self, and stamps the refresh time', async () => {
      const movie = await seedMovie({ moviedb_id: MOVIE_BASE + 1, name: 'Source' });
      mockGetMovieRecommendations.mockResolvedValue([
        tmdbMovie(MOVIE_BASE + 50),
        tmdbMovie(MOVIE_BASE + 50, 'Duplicate'),
        tmdbMovie(MOVIE_BASE + 1, 'Self'),
        { ...tmdbMovie(MOVIE_BASE + 51), releasedate: null },
      ]);

      await refreshMovieRecommendations(movie.id);

      const rows = await db
        .select()
        .from(movie_recommendations)
        .where(eq(movie_recommendations.source_movie_id, movie.id))
        .orderBy(movie_recommendations.moviedb_id);
      expect(rows.map((r) => r.moviedb_id)).toEqual([MOVIE_BASE + 50, MOVIE_BASE + 51]);
      expect(rows[0]?.releasedate).toBe('2020-05-01');
      expect(rows[1]?.releasedate).toBeNull();
      const [updated] = await db.select().from(movies).where(eq(movies.id, movie.id));
      expect(updated?.recommendations_refreshed_at).toBeInstanceOf(Date);
    });

    it('replaces previously cached rows', async () => {
      const movie = await seedMovie({ moviedb_id: MOVIE_BASE + 2, name: 'Replace Source' });
      mockGetMovieRecommendations.mockResolvedValueOnce([tmdbMovie(MOVIE_BASE + 60)]);
      await refreshMovieRecommendations(movie.id);
      mockGetMovieRecommendations.mockResolvedValueOnce([]);
      await refreshMovieRecommendations(movie.id);

      const rows = await db
        .select()
        .from(movie_recommendations)
        .where(eq(movie_recommendations.source_movie_id, movie.id));
      expect(rows).toEqual([]);
    });

    it('keeps existing rows when TMDB fails', async () => {
      const movie = await seedMovie({ moviedb_id: MOVIE_BASE + 3, name: 'Failing Source' });
      mockGetMovieRecommendations.mockResolvedValueOnce([tmdbMovie(MOVIE_BASE + 70)]);
      await refreshMovieRecommendations(movie.id);
      mockGetMovieRecommendations.mockRejectedValueOnce(new Error('TMDB down'));
      await expect(refreshMovieRecommendations(movie.id)).rejects.toThrow('TMDB down');

      const rows = await db
        .select()
        .from(movie_recommendations)
        .where(eq(movie_recommendations.source_movie_id, movie.id));
      expect(rows).toHaveLength(1);
    });
  });

  describe('refreshTvShowRecommendations', () => {
    it('throws ResourceNotFound for an unknown show', async () => {
      await expect(refreshTvShowRecommendations('00000000-0000-4000-8000-0000000000ff')).rejects.toBeInstanceOf(
        ResourceNotFound,
      );
    });

    it('caches recommendations, drops duplicates and self, and stamps the refresh time', async () => {
      const show = await seedTvShow({ moviedb_id: SHOW_BASE + 1, name: 'Show Source' });
      mockGetTvShowRecommendations.mockResolvedValue([
        tmdbShow(SHOW_BASE + 50),
        tmdbShow(SHOW_BASE + 50, 'Duplicate'),
        tmdbShow(SHOW_BASE + 1, 'Self'),
      ]);

      await refreshTvShowRecommendations(show.id);

      const rows = await db
        .select()
        .from(tvshow_recommendations)
        .where(eq(tvshow_recommendations.source_tvshow_id, show.id));
      expect(rows.map((r) => r.moviedb_id)).toEqual([SHOW_BASE + 50]);
      expect(rows[0]?.country).toBe('US');
      const [updated] = await db.select().from(tvshows).where(eq(tvshows.id, show.id));
      expect(updated?.recommendations_refreshed_at).toBeInstanceOf(Date);
    });

    it('stamps the refresh time when there are no recommendations', async () => {
      const show = await seedTvShow({ moviedb_id: SHOW_BASE + 2, name: 'Empty Show' });
      mockGetTvShowRecommendations.mockResolvedValue([]);
      await refreshTvShowRecommendations(show.id);
      const [updated] = await db.select().from(tvshows).where(eq(tvshows.id, show.id));
      expect(updated?.recommendations_refreshed_at).toBeInstanceOf(Date);
    });
  });

  describe('selectors', () => {
    it('lists subscribed movies that are never-fetched or stale, but not fresh or unsubscribed ones', async () => {
      const user = await seedUser({ email: `vitest-recs-sel-${Date.now()}@example.com`, password: 'password123!' });
      const never = (
        await seedSubscribedMovie({ watcherId: user.id, movie: { moviedb_id: MOVIE_BASE + 10 }, watched: true })
      ).movie;
      const stale = (await seedSubscribedMovie({ watcherId: user.id, movie: { moviedb_id: MOVIE_BASE + 11 } })).movie;
      const fresh = (await seedSubscribedMovie({ watcherId: user.id, movie: { moviedb_id: MOVIE_BASE + 12 } })).movie;
      const unsubscribed = await seedMovie({ moviedb_id: MOVIE_BASE + 13 });
      await db
        .update(movies)
        .set({ recommendations_refreshed_at: DateTime.utc().minus({ days: 8 }).toJSDate() })
        .where(eq(movies.id, stale.id));
      await db.update(movies).set({ recommendations_refreshed_at: new Date() }).where(eq(movies.id, fresh.id));

      const ids = (await listMoviesNeedingRecommendations()).map((r) => r.movie_id);
      expect(ids).toContain(never.id);
      expect(ids).toContain(stale.id);
      expect(ids).not.toContain(fresh.id);
      expect(ids).not.toContain(unsubscribed.id);
    });

    it('lists subscribed shows that are never-fetched or stale, but not fresh or unsubscribed ones', async () => {
      const user = await seedUser({ email: `vitest-recs-sel-s-${Date.now()}@example.com`, password: 'password123!' });
      const never = (await seedSubscribedTvShow({ watcherId: user.id, show: { moviedb_id: SHOW_BASE + 10 } })).show;
      const stale = (await seedSubscribedTvShow({ watcherId: user.id, show: { moviedb_id: SHOW_BASE + 11 } })).show;
      const fresh = (await seedSubscribedTvShow({ watcherId: user.id, show: { moviedb_id: SHOW_BASE + 12 } })).show;
      const unsubscribed = await seedTvShow({ moviedb_id: SHOW_BASE + 13 });
      await db
        .update(tvshows)
        .set({ recommendations_refreshed_at: DateTime.utc().minus({ days: 8 }).toJSDate() })
        .where(eq(tvshows.id, stale.id));
      await db.update(tvshows).set({ recommendations_refreshed_at: new Date() }).where(eq(tvshows.id, fresh.id));

      const ids = (await listShowsNeedingRecommendations()).map((r) => r.tvshow_id);
      expect(ids).toContain(never.id);
      expect(ids).toContain(stale.id);
      expect(ids).not.toContain(fresh.id);
      expect(ids).not.toContain(unsubscribed.id);
    });
  });

  describe('cache on subscribe', () => {
    it('fetches movie recommendations when none are cached', async () => {
      const movie = await seedMovie({ moviedb_id: MOVIE_BASE + 20 });
      mockGetMovieRecommendations.mockResolvedValue([tmdbMovie(MOVIE_BASE + 80)]);

      await cacheMovieRecommendationsIfMissing(movie);

      const rows = await db
        .select()
        .from(movie_recommendations)
        .where(eq(movie_recommendations.source_movie_id, movie.id));
      expect(rows).toHaveLength(1);
    });

    it('skips movies that already have cached recommendations', async () => {
      await cacheMovieRecommendationsIfMissing({ id: 'unused', recommendations_refreshed_at: new Date() });
      expect(mockGetMovieRecommendations).not.toHaveBeenCalled();
    });

    it('logs and swallows movie failures', async () => {
      const movie = await seedMovie({ moviedb_id: MOVIE_BASE + 21 });
      mockGetMovieRecommendations.mockRejectedValue(new Error('TMDB down'));

      await expect(cacheMovieRecommendationsIfMissing(movie)).resolves.toBeUndefined();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'movie recommendations fetch failed',
        expect.objectContaining({ movieId: movie.id, error: 'TMDB down' }),
      );
    });

    it('logs a non-Error rejection as a string', async () => {
      const movie = await seedMovie({ moviedb_id: MOVIE_BASE + 22 });
      mockGetMovieRecommendations.mockRejectedValue('boom');

      await cacheMovieRecommendationsIfMissing(movie);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'movie recommendations fetch failed',
        expect.objectContaining({ error: 'boom' }),
      );
    });

    it('fetches show recommendations when none are cached', async () => {
      const show = await seedTvShow({ moviedb_id: SHOW_BASE + 20 });
      mockGetTvShowRecommendations.mockResolvedValue([tmdbShow(SHOW_BASE + 80)]);

      await cacheTvShowRecommendationsIfMissing(show);

      const rows = await db
        .select()
        .from(tvshow_recommendations)
        .where(eq(tvshow_recommendations.source_tvshow_id, show.id));
      expect(rows).toHaveLength(1);
    });

    it('skips shows that already have cached recommendations', async () => {
      await cacheTvShowRecommendationsIfMissing({ id: 'unused', recommendations_refreshed_at: new Date() });
      expect(mockGetTvShowRecommendations).not.toHaveBeenCalled();
    });

    it('logs and swallows show failures', async () => {
      const show = await seedTvShow({ moviedb_id: SHOW_BASE + 21 });
      mockGetTvShowRecommendations.mockRejectedValue(new Error('TMDB down'));

      await expect(cacheTvShowRecommendationsIfMissing(show)).resolves.toBeUndefined();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'show recommendations fetch failed',
        expect.objectContaining({ tvshowId: show.id, error: 'TMDB down' }),
      );
    });

    it('logs a non-Error show rejection as a string', async () => {
      const show = await seedTvShow({ moviedb_id: SHOW_BASE + 22 });
      mockGetTvShowRecommendations.mockRejectedValue('boom');

      await cacheTvShowRecommendationsIfMissing(show);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'show recommendations fetch failed',
        expect.objectContaining({ error: 'boom' }),
      );
    });
  });
});
