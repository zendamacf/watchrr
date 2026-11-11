import { sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/lib/db';
import type { ActivityPoint, GenreStat, OverallStats, ShowStatusCounts, WatchCounts, WeekdayPoint } from './types';

const ENDED_STATUSES = new Set(['Ended', 'Canceled']);
const DEFAULT_RANGE_WEEKS = 12;

export type OverallStatsOptions = {
  userId: string;
  /** IANA timezone used for day/week bucketing. */
  timezone?: string;
  /** Inclusive start (yyyy-MM-dd) of the activity/weekday range. Defaults to 12 weeks ago. */
  from?: string;
  /** Inclusive end (yyyy-MM-dd) of the activity/weekday range. Defaults to today. */
  to?: string;
  /** Overrides the current time (tests). */
  now?: DateTime;
};

export function isValidTimezone(timezone: string): boolean {
  return DateTime.local().setZone(timezone).isValid;
}

const emptyCounts = (): WatchCounts => ({ total: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, unknownDate: 0 });

/** Longest and current runs of consecutive days (ISO dates, any order, duplicates allowed). */
export function computeStreaks(dates: string[], today: string): { current: number; longest: number } {
  const days = [...new Set(dates)].sort();
  let longest = 0;
  let run = 0;
  let previous: DateTime | null = null;
  for (const day of days) {
    const date = DateTime.fromISO(day, { zone: 'utc' });
    run = previous && date.diff(previous, 'days').days === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  // The current streak survives until the end of the day after the last watch.
  const last = days.at(-1);
  const yesterday = DateTime.fromISO(today, { zone: 'utc' }).minus({ days: 1 }).toISODate();
  const current = last === today || last === yesterday ? run : 0;
  return { current, longest };
}

function fillWeeks(rows: Map<string, { episodes: number; movies: number }>, from: DateTime, to: DateTime) {
  const points: ActivityPoint[] = [];
  let week = from.startOf('week');
  while (week <= to) {
    const key = week.toISODate() as string;
    points.push({ weekStart: key, episodes: rows.get(key)?.episodes ?? 0, movies: rows.get(key)?.movies ?? 0 });
    week = week.plus({ weeks: 1 });
  }
  return points;
}

export async function getOverallStats(options: OverallStatsOptions): Promise<OverallStats> {
  const { userId, timezone = 'UTC' } = options;
  const now = (options.now ?? DateTime.now()).setZone(timezone);
  const today = now.toISODate() as string;
  const to = options.to ? DateTime.fromISO(options.to, { zone: timezone }) : now.startOf('day');
  const from = options.from
    ? DateTime.fromISO(options.from, { zone: timezone })
    : to.minus({ weeks: DEFAULT_RANGE_WEEKS }).startOf('week');
  const rangeStart = from.startOf('day').toISO() as string;
  const rangeEnd = to.endOf('day').toISO() as string;

  const events = sql`(
    SELECT we.watched_at, 'episode' AS kind, e.runtime
      FROM watched_episodes we JOIN episodes e ON e.id = we.episode_id
     WHERE we.watcher_id = ${userId}
    UNION ALL
    SELECT sm.watched_at, 'movie' AS kind, m.runtime
      FROM subscribed_movies sm JOIN movies m ON m.id = sm.movie_id
     WHERE sm.watcher_id = ${userId} AND sm.watched
  ) AS ev`;

  const weekStart = now.startOf('week').toISO();
  const monthStart = now.startOf('month').toISO();
  const yearStart = now.startOf('year').toISO();

  const [countRows, activityRows, weekdayRows, dayRows, showRows, genreRows] = await Promise.all([
    db.execute<{
      kind: string;
      total: number;
      unknown: number;
      week: number;
      month: number;
      year: number;
      minutes: number;
      missing_runtime: number;
    }>(sql`
      SELECT kind,
             count(*)::int AS total,
             count(*) FILTER (WHERE watched_at IS NULL)::int AS unknown,
             count(*) FILTER (WHERE watched_at >= ${weekStart}::timestamptz)::int AS week,
             count(*) FILTER (WHERE watched_at >= ${monthStart}::timestamptz)::int AS month,
             count(*) FILTER (WHERE watched_at >= ${yearStart}::timestamptz)::int AS year,
             coalesce(sum(runtime), 0)::int AS minutes,
             count(*) FILTER (WHERE runtime IS NULL)::int AS missing_runtime
        FROM ${events}
       GROUP BY kind`),
    db.execute<{ week_start: string; kind: string; count: number }>(sql`
      SELECT date_trunc('week', watched_at AT TIME ZONE ${timezone})::date::text AS week_start,
             kind, count(*)::int AS count
        FROM ${events}
       WHERE watched_at >= ${rangeStart}::timestamptz AND watched_at <= ${rangeEnd}::timestamptz
       GROUP BY 1, 2`),
    db.execute<{ weekday: number; count: number }>(sql`
      SELECT extract(isodow FROM watched_at AT TIME ZONE ${timezone})::int AS weekday, count(*)::int AS count
        FROM ${events}
       WHERE watched_at >= ${rangeStart}::timestamptz AND watched_at <= ${rangeEnd}::timestamptz
       GROUP BY 1`),
    db.execute<{ day: string }>(sql`
      SELECT DISTINCT (watched_at AT TIME ZONE ${timezone})::date::text AS day
        FROM ${events} WHERE watched_at IS NOT NULL`),
    db.execute<{ status: string | null; snoozed_until: string | null; backlog: number }>(sql`
      SELECT s.status, st.snoozed_until::text AS snoozed_until,
             count(e.id) FILTER (WHERE e.airdate <= ${today}::date AND we.episode_id IS NULL)::int AS backlog
        FROM subscribed_tvshows st
        JOIN tvshows s ON s.id = st.tvshow_id
        LEFT JOIN episodes e ON e.tvshow_id = s.id
        LEFT JOIN watched_episodes we ON we.episode_id = e.id AND we.watcher_id = ${userId}
       WHERE st.watcher_id = ${userId}
       GROUP BY st.tvshow_id, s.status, st.snoozed_until`),
    db.execute<{ genre_id: number | null; name: string | null; episodes: number; movies: number; minutes: number }>(sql`
      SELECT g.id AS genre_id, g.name,
             count(*) FILTER (WHERE w.kind = 'episode')::int AS episodes,
             count(*) FILTER (WHERE w.kind = 'movie')::int AS movies,
             coalesce(sum(w.runtime), 0)::int AS minutes
        FROM (
          SELECT 'episode' AS kind, e.runtime, e.tvshow_id AS item_id
            FROM watched_episodes we JOIN episodes e ON e.id = we.episode_id
           WHERE we.watcher_id = ${userId}
          UNION ALL
          SELECT 'movie' AS kind, m.runtime, m.id AS item_id
            FROM subscribed_movies sm JOIN movies m ON m.id = sm.movie_id
           WHERE sm.watcher_id = ${userId} AND sm.watched
        ) w
        LEFT JOIN tvshow_genres tg ON w.kind = 'episode' AND tg.tvshow_id = w.item_id
        LEFT JOIN movie_genres mg ON w.kind = 'movie' AND mg.movie_id = w.item_id
        LEFT JOIN genres g ON g.id = coalesce(tg.genre_id, mg.genre_id)
       GROUP BY g.id, g.name`),
  ]);

  const genres: GenreStat[] = genreRows
    .map((row) => ({
      id: row.genre_id,
      name: row.name ?? 'Unknown',
      episodes: row.episodes,
      movies: row.movies,
      minutes: row.minutes,
    }))
    .sort((a, b) => {
      // Unknown always last, otherwise most watched first.
      if ((a.id === null) !== (b.id === null)) return a.id === null ? 1 : -1;
      return b.episodes + b.movies - (a.episodes + a.movies) || a.name.localeCompare(b.name);
    });

  const episodes = emptyCounts();
  const movies = emptyCounts();
  let watchMinutes = 0;
  let missingRuntimeCount = 0;
  for (const row of countRows) {
    const counts = row.kind === 'episode' ? episodes : movies;
    counts.total = row.total;
    counts.unknownDate = row.unknown;
    counts.thisWeek = row.week;
    counts.thisMonth = row.month;
    counts.thisYear = row.year;
    watchMinutes += row.minutes;
    missingRuntimeCount += row.missing_runtime;
  }

  const byWeek = new Map<string, { episodes: number; movies: number }>();
  for (const row of activityRows) {
    const entry = byWeek.get(row.week_start) ?? { episodes: 0, movies: 0 };
    if (row.kind === 'episode') entry.episodes = row.count;
    else entry.movies = row.count;
    byWeek.set(row.week_start, entry);
  }

  const weekdays: WeekdayPoint[] = Array.from({ length: 7 }, (_, i) => ({
    weekday: i + 1,
    count: weekdayRows.find((r) => r.weekday === i + 1)?.count ?? 0,
  }));

  const shows: ShowStatusCounts = { watching: 0, caughtUp: 0, snoozed: 0, ended: 0 };
  let backlog = 0;
  for (const show of showRows) {
    backlog += show.backlog;
    if (show.snoozed_until && show.snoozed_until > today) shows.snoozed++;
    else if (show.status && ENDED_STATUSES.has(show.status)) shows.ended++;
    else if (show.backlog === 0) shows.caughtUp++;
    else shows.watching++;
  }

  return {
    range: { from: from.toISODate() as string, to: to.toISODate() as string },
    timezone,
    episodes,
    movies,
    watchMinutes,
    missingRuntimeCount,
    activity: fillWeeks(byWeek, from, to),
    weekdays,
    shows,
    backlog,
    streaks: computeStreaks(
      dayRows.map((r) => r.day),
      today,
    ),
    genres,
  };
}
