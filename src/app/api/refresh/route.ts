import chunk from 'lodash.chunk';
import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { listCronMoviesToRefresh, listCronShowsToRefresh } from '@/lib/refresher/cron-refresh';
import { refreshMovie } from '@/lib/refresher/movies';
import { refreshTvShow } from '@/lib/refresher/tvshows';

/**
 * Refresh all media metadata. Requires CRON_SECRET bearer token.
 *
 * Refreshing is done in chunks to avoid ratelimiting.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET is not set');

  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }

  const started = Date.now();
  logger.info('cron refresh started', { operation: 'cronRefresh' });

  const subbedMovies = await listCronMoviesToRefresh();
  for (const movieChunk of chunk(subbedMovies, 30)) {
    await Promise.all(movieChunk.map((m) => refreshMovie(m.movie_id)));
  }

  const subbedShows = await listCronShowsToRefresh();
  for (const showChunk of chunk(subbedShows, 30)) {
    await Promise.all(showChunk.map((s) => refreshTvShow(s.tvshow_id)));
  }

  logger.info('cron refresh completed', {
    operation: 'cronRefresh',
    durationMs: Date.now() - started,
    movieCount: subbedMovies.length,
    showCount: subbedShows.length,
  });

  return NextResponse.json(
    {
      message: 'Success',
      refreshed: { movies: subbedMovies.length, shows: subbedShows.length },
    },
    { status: 200 },
  );
}
