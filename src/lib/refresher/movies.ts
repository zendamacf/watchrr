/**
 * Refresh all metadata for a Movie.
 *
 * @throws {ResourceNotFound} if the Movie cannot be found.
 */

import { Movie } from '@/types';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '../db';
import { movies } from '../db/schema';
import { getMovie, TMDBMovie } from '../themoviedb/movies';
import { ResourceNotFound } from './errors';

export const refreshMovie = async (movie_id: number) => {
  const [dbMovie] = await db.select().from(movies).where(eq(movies.id, movie_id));
  if (!dbMovie) throw new ResourceNotFound();

  console.log(`[MOVIE][${dbMovie.name}] Refreshing`);
  const apiMovie = await getMovie(dbMovie.moviedb_id);
  const movieLookup: { dbKey: keyof Movie; apiKey: keyof TMDBMovie }[] = [
    { dbKey: 'name', apiKey: 'name' },
    { dbKey: 'description', apiKey: 'description' },
    { dbKey: 'description', apiKey: 'description' },
    { dbKey: 'poster_slug', apiKey: 'poster' },
    { dbKey: 'backdrop_slug', apiKey: 'backdrop' },
    { dbKey: 'releasedate', apiKey: 'releasedate' },
  ];

  const diffs = movieLookup.filter(({ dbKey, apiKey }) => dbMovie[dbKey] !== apiMovie[apiKey]);
  if (diffs.length) {
    console.log(`[MOVIE][${dbMovie.name}] Updating metadata, changes in ${Object.keys(diffs)}`);
    await db
      .update(movies)
      .set({
        name: apiMovie.name,
        description: apiMovie.description,
        releasedate: DateTime.fromISO(apiMovie.releasedate).toSQLDate()!,
        poster_slug: apiMovie.poster,
        backdrop_slug: apiMovie.backdrop,
      })
      .where(eq(movies.id, movie_id));
  }
  console.log(`[MOVIE][${dbMovie.name}] Finished refreshing`);
};
