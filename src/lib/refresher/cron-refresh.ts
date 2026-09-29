import { and, eq, exists, gte, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/lib/db';
import { episodes, movies, subscribed_movies, subscribed_tvshows, tvshows } from '@/lib/db/schema';

export type CronRefreshMode = 'full' | 'incremental';

/** Production cron refresh always runs incrementally. */
export const DEFAULT_CRON_REFRESH_MODE: CronRefreshMode = 'incremental';

const MOVIE_STALE_HOURS = 168;
const SHOW_STALE_HOURS = 48;
const SHOW_RECENT_EPISODE_DAYS = 7;
const SHOW_IMMINENT_EPISODE_DAYS = 14;

export function getMovieStaleBefore(now: DateTime<boolean> = DateTime.utc()): Date {
  return now.minus({ hours: MOVIE_STALE_HOURS }).toJSDate();
}

export function getShowStaleBefore(now: DateTime<boolean> = DateTime.utc()): Date {
  return now.minus({ hours: SHOW_STALE_HOURS }).toJSDate();
}

export function getShowImminentEpisodeWindow(now: DateTime<boolean> = DateTime.utc()) {
  const start = now.minus({ days: SHOW_RECENT_EPISODE_DAYS }).toISODate();
  const end = now.plus({ days: SHOW_IMMINENT_EPISODE_DAYS }).toISODate();
  if (!start || !end) throw new Error('Failed to compute episode window');
  return { start, end };
}

export function movieNeedsCronRefresh(
  metadataRefreshedAt: Date | null,
  mode: CronRefreshMode,
  staleBefore: Date,
): boolean {
  if (mode === 'full') return true;
  if (!metadataRefreshedAt) return true;
  return metadataRefreshedAt < staleBefore;
}

export function buildIncrementalMovieFilter(staleBefore: Date) {
  return or(isNull(movies.metadata_refreshed_at), lt(movies.metadata_refreshed_at, staleBefore));
}

export function buildIncrementalShowFilter(staleBefore: Date, episodeWindow: { start: string; end: string }) {
  const imminentEpisode = exists(
    db
      .select({ one: sql`1` })
      .from(episodes)
      .where(
        and(
          eq(episodes.tvshow_id, tvshows.id),
          gte(episodes.airdate, episodeWindow.start),
          lte(episodes.airdate, episodeWindow.end),
        ),
      ),
  );

  return or(isNull(tvshows.metadata_refreshed_at), lt(tvshows.metadata_refreshed_at, staleBefore), imminentEpisode);
}

export async function listCronMoviesToRefresh(mode: CronRefreshMode = DEFAULT_CRON_REFRESH_MODE) {
  const staleBefore = getMovieStaleBefore();
  const conditions = [eq(subscribed_movies.watched, false)];
  if (mode === 'incremental') {
    const incremental = buildIncrementalMovieFilter(staleBefore);
    if (incremental) conditions.push(incremental);
  }

  return db
    .selectDistinct({ movie_id: subscribed_movies.movie_id, name: movies.name })
    .from(subscribed_movies)
    .innerJoin(movies, eq(movies.id, subscribed_movies.movie_id))
    .where(and(...conditions))
    .orderBy(movies.name);
}

export async function listCronShowsToRefresh(mode: CronRefreshMode = DEFAULT_CRON_REFRESH_MODE) {
  const staleBefore = getShowStaleBefore();
  const episodeWindow = getShowImminentEpisodeWindow();
  const base = db
    .selectDistinct({ tvshow_id: subscribed_tvshows.tvshow_id, name: tvshows.name })
    .from(subscribed_tvshows)
    .innerJoin(tvshows, eq(tvshows.id, subscribed_tvshows.tvshow_id));

  if (mode === 'incremental') {
    const filter = buildIncrementalShowFilter(staleBefore, episodeWindow);
    if (filter) {
      return base.where(filter).orderBy(tvshows.name);
    }
  }

  return base.orderBy(tvshows.name);
}
