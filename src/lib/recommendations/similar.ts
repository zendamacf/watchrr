import { and, asc, eq, notExists } from 'drizzle-orm';
import { db } from '@/lib/db';
import { movie_recommendations, movies, not_interested_movies, subscribed_movies } from '@/lib/db/schema';
import type { SimilarMovie } from './types';

/** How many similar movies a movie's page lists. */
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
