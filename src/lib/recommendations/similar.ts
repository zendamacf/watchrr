import { and, asc, eq, notExists } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  movie_recommendations,
  movies,
  not_interested_movies,
  not_interested_tvshows,
  subscribed_movies,
  subscribed_tvshows,
  tvshow_recommendations,
  tvshows,
} from '@/lib/db/schema';
import type { SimilarMovie, SimilarShow } from './types';

/** How many similar titles a movie or show page lists. */
export const SIMILAR_LIMIT = 12;

/**
 * Cached TMDB recommendations for one movie, for its detail page. Leaves out anything the user
 * already follows or hid from Discover. Reads only the database, never TMDB.
 */
export async function listSimilarMovies(userId: string, movieId: string): Promise<SimilarMovie[]> {
  return db
    .select({
      moviedb_id: movie_recommendations.moviedb_id,
      name: movie_recommendations.name,
      description: movie_recommendations.description,
      releasedate: movie_recommendations.releasedate,
      poster_slug: movie_recommendations.poster_slug,
    })
    .from(movie_recommendations)
    .where(
      and(
        eq(movie_recommendations.source_movie_id, movieId),
        notExists(
          db
            .select({ one: movies.id })
            .from(movies)
            .innerJoin(subscribed_movies, eq(subscribed_movies.movie_id, movies.id))
            .where(
              and(eq(movies.moviedb_id, movie_recommendations.moviedb_id), eq(subscribed_movies.watcher_id, userId)),
            ),
        ),
        notExists(
          db
            .select({ one: not_interested_movies.moviedb_id })
            .from(not_interested_movies)
            .where(
              and(
                eq(not_interested_movies.watcher_id, userId),
                eq(not_interested_movies.moviedb_id, movie_recommendations.moviedb_id),
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(movie_recommendations.name), asc(movie_recommendations.moviedb_id))
    .limit(SIMILAR_LIMIT);
}

/** Cached TMDB recommendations for one show. Same rules as {@link listSimilarMovies}. */
export async function listSimilarShows(userId: string, tvshowId: string): Promise<SimilarShow[]> {
  return db
    .select({
      moviedb_id: tvshow_recommendations.moviedb_id,
      name: tvshow_recommendations.name,
      description: tvshow_recommendations.description,
      country: tvshow_recommendations.country,
      poster_slug: tvshow_recommendations.poster_slug,
    })
    .from(tvshow_recommendations)
    .where(
      and(
        eq(tvshow_recommendations.source_tvshow_id, tvshowId),
        notExists(
          db
            .select({ one: tvshows.id })
            .from(tvshows)
            .innerJoin(subscribed_tvshows, eq(subscribed_tvshows.tvshow_id, tvshows.id))
            .where(
              and(eq(tvshows.moviedb_id, tvshow_recommendations.moviedb_id), eq(subscribed_tvshows.watcher_id, userId)),
            ),
        ),
        notExists(
          db
            .select({ one: not_interested_tvshows.moviedb_id })
            .from(not_interested_tvshows)
            .where(
              and(
                eq(not_interested_tvshows.watcher_id, userId),
                eq(not_interested_tvshows.moviedb_id, tvshow_recommendations.moviedb_id),
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(tvshow_recommendations.name), asc(tvshow_recommendations.moviedb_id))
    .limit(SIMILAR_LIMIT);
}
