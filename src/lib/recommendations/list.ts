import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { not_interested_movies, not_interested_tvshows } from '@/lib/db/schema';
import { FINISHED_BONUS, SOURCE_WEIGHT } from './score';
import type { Recommendation, RecommendationType } from './types';

const sourceWeightSql = (finished: ReturnType<typeof sql>) =>
  sql`(${sql.raw(String(SOURCE_WEIGHT))} + CASE WHEN ${finished} THEN ${sql.raw(String(FINISHED_BONUS))} ELSE 0 END)`;

/** Aggregates one row per candidate, from per-source rows exposing `w` (weight) and `source_name`. */
const aggregate = (type: RecommendationType, rows: ReturnType<typeof sql>) => sql`
  SELECT ${type}::text AS type,
    moviedb_id,
    (array_agg(name ORDER BY w DESC, source_name))[1] AS name,
    (array_agg(description ORDER BY w DESC, source_name))[1] AS description,
    (array_agg(poster_slug ORDER BY w DESC, source_name))[1] AS poster_slug,
    (array_agg(backdrop_slug ORDER BY w DESC, source_name))[1] AS backdrop_slug,
    (array_agg(releasedate ORDER BY w DESC, source_name))[1] AS releasedate,
    (array_agg(country ORDER BY w DESC, source_name))[1] AS country,
    sum(w)::int AS score,
    (array_agg(source_name ORDER BY w DESC, source_name))[1] AS because
  FROM (${rows}) AS rows
  GROUP BY moviedb_id
`;

const movieCandidates = (userId: string) =>
  aggregate(
    'movie',
    sql`
    SELECT r.moviedb_id, r.name, r.description, r.poster_slug, r.backdrop_slug,
      r.releasedate::text AS releasedate, NULL::text AS country,
      src.name AS source_name,
      ${sourceWeightSql(sql`sm.watched`)} AS w
    FROM movie_recommendations r
    JOIN subscribed_movies sm ON sm.movie_id = r.source_movie_id AND sm.watcher_id = ${userId}
    JOIN movies src ON src.id = sm.movie_id
    WHERE NOT EXISTS (
      SELECT 1 FROM movies m
      JOIN subscribed_movies tracked ON tracked.movie_id = m.id
      WHERE m.moviedb_id = r.moviedb_id AND tracked.watcher_id = ${userId}
    )
    AND NOT EXISTS (
      SELECT 1 FROM not_interested_movies n
      WHERE n.watcher_id = ${userId} AND n.moviedb_id = r.moviedb_id
    )
  `,
  );

/** A show is finished when the user watched something and no aired episode is left unwatched. */
const showFinished = (userId: string) => sql`(
  EXISTS (
    SELECT 1 FROM watched_episodes we
    JOIN episodes e ON e.id = we.episode_id
    WHERE e.tvshow_id = src.id AND we.watcher_id = ${userId}
  )
  AND NOT EXISTS (
    SELECT 1 FROM episodes e
    WHERE e.tvshow_id = src.id AND e.airdate <= current_date
    AND NOT EXISTS (
      SELECT 1 FROM watched_episodes we WHERE we.episode_id = e.id AND we.watcher_id = ${userId}
    )
  )
)`;

const showCandidates = (userId: string) =>
  aggregate(
    'tvshow',
    sql`
    SELECT r.moviedb_id, r.name, r.description, r.poster_slug, r.backdrop_slug,
      NULL::text AS releasedate, r.country,
      src.name AS source_name,
      ${sourceWeightSql(showFinished(userId))} AS w
    FROM tvshow_recommendations r
    JOIN subscribed_tvshows st ON st.tvshow_id = r.source_tvshow_id AND st.watcher_id = ${userId}
    JOIN tvshows src ON src.id = st.tvshow_id
    WHERE NOT EXISTS (
      SELECT 1 FROM tvshows s
      JOIN subscribed_tvshows tracked ON tracked.tvshow_id = s.id
      WHERE s.moviedb_id = r.moviedb_id AND tracked.watcher_id = ${userId}
    )
    AND NOT EXISTS (
      SELECT 1 FROM not_interested_tvshows n
      WHERE n.watcher_id = ${userId} AND n.moviedb_id = r.moviedb_id
    )
  `,
  );

const candidates = (userId: string, type?: RecommendationType) => {
  if (type === 'movie') return movieCandidates(userId);
  if (type === 'tvshow') return showCandidates(userId);
  return sql`${movieCandidates(userId)} UNION ALL ${showCandidates(userId)}`;
};

/**
 * A user's recommendations from the cache, best first.
 *
 * Excludes anything the user already tracks or hid. Ordering ends in type and
 * TMDB id so pages are stable.
 */
export async function listRecommendations(options: {
  userId: string;
  type?: RecommendationType;
  limit: number;
  offset: number;
}): Promise<{ data: Recommendation[]; total: number }> {
  const { userId, type, limit, offset } = options;
  const all = candidates(userId, type);

  const [rows, totals] = await Promise.all([
    db.execute<Recommendation>(sql`
      SELECT * FROM (${all}) AS candidates
      ORDER BY score DESC, name, type, moviedb_id
      LIMIT ${limit} OFFSET ${offset}
    `),
    db.execute<{ total: number }>(sql`SELECT count(*)::int AS total FROM (${all}) AS candidates`),
  ]);

  return { data: [...rows], total: totals[0]?.total ?? 0 };
}

const notInterestedTable = (type: RecommendationType) =>
  type === 'movie' ? not_interested_movies : not_interested_tvshows;

/** Hide a candidate from the user's Discover list. Safe to repeat. */
export async function markNotInterested(userId: string, type: RecommendationType, moviedbId: number) {
  await db.insert(notInterestedTable(type)).values({ watcher_id: userId, moviedb_id: moviedbId }).onConflictDoNothing();
}

/** Undo `markNotInterested`. Safe to repeat. */
export async function unmarkNotInterested(userId: string, type: RecommendationType, moviedbId: number) {
  const table = notInterestedTable(type);
  await db.delete(table).where(and(eq(table.watcher_id, userId), eq(table.moviedb_id, moviedbId)));
}
