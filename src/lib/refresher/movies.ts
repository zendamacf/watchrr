/**
 * Refresh all metadata for a Movie.
 *
 * @throws {ResourceNotFound} if the Movie cannot be found.
 */

import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import type { Movie } from '@/types';
import { db } from '../db';
import { movies } from '../db/schema';
import { getMovie, type TMDBMovie } from '../themoviedb/movies';
import { ResourceNotFound } from './errors';
import { type DiffLookup, dateCompare, getDiff } from './utils';

export const refreshMovie = async (movieUuid: string) => {
  const [dbMovie] = await db.select().from(movies).where(eq(movies.uuid, movieUuid));
  if (!dbMovie) throw new ResourceNotFound();

  console.log(`[MOVIE][${dbMovie.name}] Refreshing`);
  const apiMovie = await getMovie(dbMovie.moviedb_id);
  const movieLookup: DiffLookup<Movie, TMDBMovie>[] = [
    { dbKey: 'name', apiKey: 'name' },
    { dbKey: 'description', apiKey: 'description' },
    { dbKey: 'description', apiKey: 'description' },
    { dbKey: 'poster_slug', apiKey: 'poster' },
    { dbKey: 'backdrop_slug', apiKey: 'backdrop' },
    { dbKey: 'releasedate', apiKey: 'releasedate', compare: dateCompare },
  ];

  const diffs = getDiff(dbMovie, apiMovie, movieLookup);
  if (diffs.length) {
    console.info(`[MOVIE][${dbMovie.name}] Updating metadata, changes in ${diffs.map((d) => d.dbKey)}`);
    await db
      .update(movies)
      .set({
        name: apiMovie.name,
        description: apiMovie.description,
        releasedate: DateTime.fromISO(apiMovie.releasedate).toSQLDate()!,
        poster_slug: apiMovie.poster,
        backdrop_slug: apiMovie.backdrop,
      })
      .where(eq(movies.uuid, movieUuid));
  }
  console.log(`[MOVIE][${dbMovie.name}] Finished refreshing`);
};
