import { and, eq, exists, gte, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/lib/db';
import { episodes, movies, subscribed_movies, subscribed_tvshows, tvshows } from '@/lib/db/schema';

export type CronRefreshMode = 'full' | 'incremental';

export function getCronRefreshMode(): CronRefreshMode {
  const raw = process.env.CRON_REFRESH_MODE?.trim().toLowerCase();
  if (raw === 'full') return 'full';
  return 'incremental';
}

export function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

export function getMovieStaleBefore(now: DateTime<boolean> = DateTime.utc()): Date {
  const hours = readPositiveIntEnv('CRON_MOVIE_STALE_HOURS', 168);
  return now.minus({ hours }).toJSDate();
}

export function getShowStaleBefore(now: DateTime<boolean> = DateTime.utc()): Date {
  const hours = readPositiveIntEnv('CRON_SHOW_STALE_HOURS', 48);
  return now.minus({ hours }).toJSDate();
}

export function getShowImminentEpisodeWindow(now: DateTime<boolean> = DateTime.utc()) {
  const pastDays = readPositiveIntEnv('CRON_SHOW_RECENT_EPISODE_DAYS', 7);
  const futureDays = readPositiveIntEnv('CRON_SHOW_IMMINENT_EPISODE_DAYS', 14);
  const start = now.minus({ days: pastDays }).toISODate();
  const end = now.plus({ days: futureDays }).toISODate();
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

export async function listCronMoviesToRefresh(mode = getCronRefreshMode()) {
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

export async function listCronShowsToRefresh(mode = getCronRefreshMode()) {
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
