/**
 * Refresh all metadata for a Movie.
 *
 * @throws {ResourceNotFound} if the Movie cannot be found.
 */

import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { logger } from '@/lib/logger';
import type { Movie } from '@/types';
import { db } from '../db';
import { movies } from '../db/schema';
import { getMovie, type TMDBMovie } from '../themoviedb/movies';
import { ResourceNotFound } from './errors';
import { type DiffLookup, dateCompare, getDiff } from './utils';

export const refreshMovie = async (movieId: string) => {
  const started = Date.now();
  const [dbMovie] = await db.select().from(movies).where(eq(movies.id, movieId));
  if (!dbMovie) throw new ResourceNotFound();

  logger.info('movie refresh started', {
    operation: 'refreshMovie',
    movieId,
    movieName: dbMovie.name,
  });

  try {
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
      logger.info('movie metadata updated', {
        operation: 'refreshMovie',
        movieId,
        movieName: dbMovie.name,
        changedFields: diffs.map((d) => d.dbKey).join(','),
      });
      await db
        .update(movies)
        .set({
          name: apiMovie.name,
          description: apiMovie.description,
          releasedate: DateTime.fromISO(apiMovie.releasedate).toSQLDate()!,
          poster_slug: apiMovie.poster,
          backdrop_slug: apiMovie.backdrop,
        })
        .where(eq(movies.id, movieId));
    }

    await db
      .update(movies)
      .set({ metadata_refreshed_at: new Date() })
      .where(eq(movies.id, movieId));

    logger.info('movie refresh completed', {
      operation: 'refreshMovie',
      movieId,
      durationMs: Date.now() - started,
      metadataChanged: diffs.length > 0,
    });
  } catch (error) {
    logger.error('movie refresh failed', error, {
      operation: 'refreshMovie',
      movieId,
      durationMs: Date.now() - started,
    });
    throw error;
  }
};
