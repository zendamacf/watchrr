import { db } from '@/lib/db';
import { subscribed_tvshows, tvshows } from '@/lib/db/schema';
import { refreshTvShow } from '@/lib/refresher/tvshows';
import { eq } from 'drizzle-orm';
import chunk from 'lodash.chunk';
import { NextResponse } from 'next/server';

/**
 * Refresh all media metadata. No authorization needed for cron.
 *
 * Refreshing is done in chunks to avoid ratelimiting.
 */
export async function GET() {
  //   const subbedMovies = await db
  //     .selectDistinct({ movie_id: subscribed_movies.movie_id, name: movies.name })
  //     .from(subscribed_movies)
  //     .innerJoin(movies, eq(movies.id, subscribed_movies.movie_id))
  //     .where(eq(subscribed_movies.watched, false))
  //     .orderBy(movies.name);

  //   for (const movieChunk of chunk(subbedMovies, 30)) {
  //     await Promise.all(movieChunk.map((m) => refreshMovie(m.movie_id)));
  //   }

  const subbedShows = await db
    .selectDistinct({ tvshow_id: subscribed_tvshows.tvshow_id, name: tvshows.name })
    .from(subscribed_tvshows)
    .innerJoin(tvshows, eq(tvshows.id, subscribed_tvshows.tvshow_id))
    .orderBy(tvshows.name);

  for (const showChunk of chunk(subbedShows, 30)) {
    await Promise.all(showChunk.map((s) => refreshTvShow(s.tvshow_id)));
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
