import { db } from '@/lib/db';
import {
  movie_recommendations,
  not_interested_movies,
  not_interested_tvshows,
  tvshow_recommendations,
} from '@/lib/db/schema';

/** Cache a movie recommendation for a source movie (idempotent on the primary key). */
export async function seedMovieRecommendation(options: {
  sourceMovieId: string;
  moviedb_id: number;
  name?: string;
  releasedate?: string | null;
}) {
  await db
    .insert(movie_recommendations)
    .values({
      source_movie_id: options.sourceMovieId,
      moviedb_id: options.moviedb_id,
      name: options.name ?? `Recommended Movie ${options.moviedb_id}`,
      releasedate: options.releasedate ?? '2021-06-01',
      poster_slug: '/rec-poster.jpg',
      backdrop_slug: '/rec-backdrop.jpg',
      description: 'A recommended movie',
    })
    .onConflictDoNothing();
}

/** Cache a show recommendation for a source show (idempotent on the primary key). */
export async function seedTvShowRecommendation(options: { sourceTvShowId: string; moviedb_id: number; name?: string }) {
  await db
    .insert(tvshow_recommendations)
    .values({
      source_tvshow_id: options.sourceTvShowId,
      moviedb_id: options.moviedb_id,
      name: options.name ?? `Recommended Show ${options.moviedb_id}`,
      country: 'US',
      poster_slug: '/rec-poster.jpg',
      backdrop_slug: '/rec-backdrop.jpg',
      description: 'A recommended show',
    })
    .onConflictDoNothing();
}

/** Hide a TMDB id from a user's Discover list. */
export async function seedNotInterested(options: { watcherId: string; type: 'movie' | 'tvshow'; moviedb_id: number }) {
  const table = options.type === 'movie' ? not_interested_movies : not_interested_tvshows;
  await db
    .insert(table)
    .values({ watcher_id: options.watcherId, moviedb_id: options.moviedb_id })
    .onConflictDoNothing();
}
