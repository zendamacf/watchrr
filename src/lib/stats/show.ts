import { and, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/lib/db';
import { episodes, subscribed_tvshows, watched_episodes } from '@/lib/db/schema';
import type { SeasonProgress, ShowStats } from './types';

export type ShowStatsOptions = {
  userId: string;
  tvshowId: string;
  timezone?: string;
  /** Overrides the current time (tests). */
  now?: DateTime;
};

/**
 * Stats for one show the user is subscribed to, or null when they are not subscribed.
 */
export async function getShowStats(options: ShowStatsOptions): Promise<ShowStats | null> {
  const { userId, tvshowId, timezone = 'UTC' } = options;
  const today = (options.now ?? DateTime.now()).setZone(timezone).toISODate() as string;

  const [subscription] = await db
    .select({ tvshow_id: subscribed_tvshows.tvshow_id })
    .from(subscribed_tvshows)
    .where(and(eq(subscribed_tvshows.watcher_id, userId), eq(subscribed_tvshows.tvshow_id, tvshowId)))
    .limit(1);
  if (!subscription) return null;

  const rows = await db
    .select({
      season: episodes.season,
      airdate: episodes.airdate,
      runtime: episodes.runtime,
      watched: watched_episodes.episode_id,
      watchedAt: watched_episodes.watched_at,
    })
    .from(episodes)
    .leftJoin(
      watched_episodes,
      and(eq(watched_episodes.episode_id, episodes.id), eq(watched_episodes.watcher_id, userId)),
    )
    .where(eq(episodes.tvshow_id, tvshowId));

  const seasons = new Map<number, SeasonProgress>();
  let watched = 0;
  let aired = 0;
  let backlog = 0;
  let backlogMinutes = 0;
  let knownRuntimes = 0;
  let nextAirDate: string | null = null;
  const watchTimes: DateTime[] = [];

  for (const row of rows) {
    const isAired = row.airdate <= today;
    const isWatched = row.watched !== null;
    const progress = seasons.get(row.season) ?? { season: row.season, watched: 0, aired: 0, total: 0 };
    progress.total++;
    if (isAired) {
      progress.aired++;
      aired++;
    } else if (!nextAirDate || row.airdate < nextAirDate) {
      nextAirDate = row.airdate;
    }
    if (isWatched) {
      progress.watched++;
      watched++;
      if (row.watchedAt) watchTimes.push(DateTime.fromJSDate(row.watchedAt, { zone: timezone }));
    } else if (isAired) {
      backlog++;
      if (row.runtime) {
        backlogMinutes += row.runtime;
        knownRuntimes++;
      }
    }
    seasons.set(row.season, progress);
  }

  watchTimes.sort((a, b) => a.toMillis() - b.toMillis());
  const first = watchTimes[0];
  const last = watchTimes.at(-1);
  // Pace is measured over at least one week so a single binge is not extrapolated.
  const weeks = first && last ? Math.max(1, last.diff(first, 'weeks').weeks) : null;

  return {
    seasons: [...seasons.values()].sort((a, b) => a.season - b.season),
    watched,
    aired,
    backlog,
    backlogMinutes: knownRuntimes > 0 ? backlogMinutes : null,
    startedAt: first?.toISO() ?? null,
    lastWatchedAt: last?.toISO() ?? null,
    episodesPerWeek: weeks ? Math.round((watchTimes.length / weeks) * 10) / 10 : null,
    nextAirDate,
  };
}
