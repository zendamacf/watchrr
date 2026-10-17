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

  const countFailures = (results: PromiseSettledResult<unknown>[]) =>
    results.filter((result) => result.status === 'rejected').length;

  const subbedMovies = await listCronMoviesToRefresh();
  let movieFailures = 0;
  for (const movieChunk of chunk(subbedMovies, 30)) {
    const results = await Promise.allSettled(movieChunk.map((m) => refreshMovie(m.movie_id)));
    movieFailures += countFailures(results);
  }

  const subbedShows = await listCronShowsToRefresh();
  let showFailures = 0;
  for (const showChunk of chunk(subbedShows, 30)) {
    const results = await Promise.allSettled(showChunk.map((s) => refreshTvShow(s.tvshow_id)));
    showFailures += countFailures(results);
  }

  logger.info('cron refresh completed', {
    operation: 'cronRefresh',
    durationMs: Date.now() - started,
    movieCount: subbedMovies.length,
    showCount: subbedShows.length,
    movieFailures,
    showFailures,
  });

  return NextResponse.json(
    {
      message: 'Success',
      refreshed: {
        movies: subbedMovies.length,
        shows: subbedShows.length,
        movieFailures,
        showFailures,
      },
    },
    { status: 200 },
  );
}
