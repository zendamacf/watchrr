import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { genres, movie_genres, tvshow_genres } from '@/lib/db/schema';

/** Genre names for a show, alphabetical. Empty until the show has been refreshed. */
export async function getTvShowGenres(tvshowId: string): Promise<string[]> {
  const rows = await db
    .select({ name: genres.name })
    .from(tvshow_genres)
    .innerJoin(genres, eq(genres.id, tvshow_genres.genre_id))
    .where(eq(tvshow_genres.tvshow_id, tvshowId))
    .orderBy(asc(genres.name));
  return rows.map((r) => r.name);
}

/** Genre names for a movie, alphabetical. Empty until the movie has been refreshed. */
export async function getMovieGenres(movieId: string): Promise<string[]> {
  const rows = await db
    .select({ name: genres.name })
    .from(movie_genres)
    .innerJoin(genres, eq(genres.id, movie_genres.genre_id))
    .where(eq(movie_genres.movie_id, movieId))
    .orderBy(asc(genres.name));
  return rows.map((r) => r.name);
}
