import { eq } from 'drizzle-orm';
import chunk from 'lodash.chunk';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { movies, subscribed_movies, subscribed_tvshows, tvshows } from '@/lib/db/schema';
import { refreshMovie } from '@/lib/refresher/movies';
import { refreshTvShow } from '@/lib/refresher/tvshows';

/**
 * Refresh all media metadata. No authorization needed for cron.
 *
 * Refreshing is done in chunks to avoid ratelimiting.
 */
export async function GET() {
  const subbedMovies = await db
    .selectDistinct({ movie_uuid: subscribed_movies.movie_uuid, name: movies.name })
    .from(subscribed_movies)
    .innerJoin(movies, eq(movies.uuid, subscribed_movies.movie_uuid))
    .where(eq(subscribed_movies.watched, false))
    .orderBy(movies.name);

  for (const movieChunk of chunk(subbedMovies, 30)) {
    await Promise.all(movieChunk.map((m) => refreshMovie(m.movie_uuid)));
  }

  const subbedShows = await db
    .selectDistinct({ tvshow_uuid: subscribed_tvshows.tvshow_uuid, name: tvshows.name })
    .from(subscribed_tvshows)
    .innerJoin(tvshows, eq(tvshows.uuid, subscribed_tvshows.tvshow_uuid))
    .orderBy(tvshows.name);

  for (const showChunk of chunk(subbedShows, 30)) {
    await Promise.all(showChunk.map((s) => refreshTvShow(s.tvshow_uuid)));
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
