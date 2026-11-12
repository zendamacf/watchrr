/**
 * Cache TMDB recommendations for subscribed movies and shows.
 *
 * Recommendations are cached per source item and shared across users, so each
 * source is fetched once no matter how many users track it. Discover reads the
 * cache only and never calls TMDB on page load.
 */

import { and, eq, exists, isNull, lt, or } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '../db';
import {
  movie_recommendations,
  movies,
  subscribed_movies,
  subscribed_tvshows,
  tvshow_recommendations,
  tvshows,
} from '../db/schema';
import { logger } from '../logger';
import { getMovieRecommendations } from '../themoviedb/movies';
import { getTvShowRecommendations } from '../themoviedb/tvshows';
import { ResourceNotFound } from './errors';
import { isoToSqlDate } from './utils';

const RECOMMENDATIONS_STALE_DAYS = 7;

export function getRecommendationsStaleBefore(now: DateTime<boolean> = DateTime.utc()): Date {
  return now.minus({ days: RECOMMENDATIONS_STALE_DAYS }).toJSDate();
}

/** Subscribed movies (watched or not) whose cached recommendations are missing or stale. */
export async function listMoviesNeedingRecommendations() {
  return db
    .select({ movie_id: movies.id, name: movies.name })
    .from(movies)
    .where(
      and(
        exists(db.select().from(subscribed_movies).where(eq(subscribed_movies.movie_id, movies.id))),
        or(
          isNull(movies.recommendations_refreshed_at),
          lt(movies.recommendations_refreshed_at, getRecommendationsStaleBefore()),
        ),
      ),
    )
    .orderBy(movies.name);
}

/** Subscribed shows whose cached recommendations are missing or stale. */
export async function listShowsNeedingRecommendations() {
  return db
    .select({ tvshow_id: tvshows.id, name: tvshows.name })
    .from(tvshows)
    .where(
      and(
        exists(db.select().from(subscribed_tvshows).where(eq(subscribed_tvshows.tvshow_id, tvshows.id))),
        or(
          isNull(tvshows.recommendations_refreshed_at),
          lt(tvshows.recommendations_refreshed_at, getRecommendationsStaleBefore()),
        ),
      ),
    )
    .orderBy(tvshows.name);
}

/**
 * Replace a movie's cached recommendations with TMDB's current list.
 * @throws {ResourceNotFound} if the movie cannot be found.
 */
export async function refreshMovieRecommendations(movieId: string) {
  const [movie] = await db.select().from(movies).where(eq(movies.id, movieId));
  if (!movie) throw new ResourceNotFound();

  const recommended = await getMovieRecommendations(movie.moviedb_id);
  // TMDB can repeat an id across entries; the primary key would reject the insert.
  const unique = [...new Map(recommended.map((r) => [r.id, r])).values()].filter((r) => r.id !== movie.moviedb_id);

  await db.transaction(async (tx) => {
    await tx.delete(movie_recommendations).where(eq(movie_recommendations.source_movie_id, movieId));
    if (unique.length) {
      await tx.insert(movie_recommendations).values(
        unique.map((r) => ({
          source_movie_id: movieId,
          moviedb_id: r.id,
          name: r.name,
          releasedate: r.releasedate ? isoToSqlDate(r.releasedate) : null,
          poster_slug: r.poster,
          backdrop_slug: r.backdrop,
          description: r.description,
        })),
      );
    }
    await tx.update(movies).set({ recommendations_refreshed_at: new Date() }).where(eq(movies.id, movieId));
  });
}

/**
 * Replace a show's cached recommendations with TMDB's current list.
 * @throws {ResourceNotFound} if the show cannot be found.
 */
export async function refreshTvShowRecommendations(tvshowId: string) {
  const [show] = await db.select().from(tvshows).where(eq(tvshows.id, tvshowId));
  if (!show) throw new ResourceNotFound();

  const recommended = await getTvShowRecommendations(show.moviedb_id);
  const unique = [...new Map(recommended.map((r) => [r.id, r])).values()].filter((r) => r.id !== show.moviedb_id);

  await db.transaction(async (tx) => {
    await tx.delete(tvshow_recommendations).where(eq(tvshow_recommendations.source_tvshow_id, tvshowId));
    if (unique.length) {
      await tx.insert(tvshow_recommendations).values(
        unique.map((r) => ({
          source_tvshow_id: tvshowId,
          moviedb_id: r.id,
          name: r.name,
          country: r.country,
          poster_slug: r.poster,
          backdrop_slug: r.backdrop,
          description: r.description,
        })),
      );
    }
    await tx.update(tvshows).set({ recommendations_refreshed_at: new Date() }).where(eq(tvshows.id, tvshowId));
  });
}

/**
 * Cache a newly tracked movie's recommendations so Discover has results before
 * the next cron run. Never throws: TMDB being unavailable must not fail adding.
 */
export async function cacheMovieRecommendationsIfMissing(movie: {
  id: string;
  recommendations_refreshed_at: Date | null;
}) {
  if (movie.recommendations_refreshed_at) return;
  try {
    await refreshMovieRecommendations(movie.id);
  } catch (error) {
    logger.warn('movie recommendations fetch failed', {
      operation: 'cacheMovieRecommendations',
      movieId: movie.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Show counterpart of `cacheMovieRecommendationsIfMissing`. */
export async function cacheTvShowRecommendationsIfMissing(show: {
  id: string;
  recommendations_refreshed_at: Date | null;
}) {
  if (show.recommendations_refreshed_at) return;
  try {
    await refreshTvShowRecommendations(show.id);
  } catch (error) {
    logger.warn('show recommendations fetch failed', {
      operation: 'cacheTvShowRecommendations',
      tvshowId: show.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
