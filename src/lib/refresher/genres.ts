import { and, eq, notInArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { genres, movie_genres, tvshow_genres } from '@/lib/db/schema';
import type { TMDBGenre } from '@/lib/themoviedb/tvshows';

async function upsertGenres(apiGenres: TMDBGenre[]) {
  if (!apiGenres.length) return;
  await db
    .insert(genres)
    .values(apiGenres.map((g) => ({ id: g.id, name: g.name })))
    .onConflictDoUpdate({ target: genres.id, set: { name: sql`excluded.name` } });
}

/** Replaces a show's genres with TMDB's list. */
export async function syncTvShowGenres(tvshowId: string, apiGenres: TMDBGenre[]) {
  await upsertGenres(apiGenres);
  const ids = apiGenres.map((g) => g.id);
  await db
    .delete(tvshow_genres)
    .where(
      ids.length
        ? and(eq(tvshow_genres.tvshow_id, tvshowId), notInArray(tvshow_genres.genre_id, ids))
        : eq(tvshow_genres.tvshow_id, tvshowId),
    );
  if (ids.length) {
    await db
      .insert(tvshow_genres)
      .values(ids.map((genre_id) => ({ tvshow_id: tvshowId, genre_id })))
      .onConflictDoNothing();
  }
}

/** Replaces a movie's genres with TMDB's list. */
export async function syncMovieGenres(movieId: string, apiGenres: TMDBGenre[]) {
  await upsertGenres(apiGenres);
  const ids = apiGenres.map((g) => g.id);
  await db
    .delete(movie_genres)
    .where(
      ids.length
        ? and(eq(movie_genres.movie_id, movieId), notInArray(movie_genres.genre_id, ids))
        : eq(movie_genres.movie_id, movieId),
    );
  if (ids.length) {
    await db
      .insert(movie_genres)
      .values(ids.map((genre_id) => ({ movie_id: movieId, genre_id })))
      .onConflictDoNothing();
  }
}
