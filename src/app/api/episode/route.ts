import { and, asc, count, eq, gte, ilike, isNull, lt, notExists, or, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { paginatedJson, parsePagination, parseSearchPattern } from '@/lib/api/pagination';
import { db } from '@/lib/db';
import { episodes, subscribed_tvshows, tvshows, watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

/**
 * Get unwatched episodes for subscribed shows
 */
export async function GET(request: NextRequest) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const pagination = parsePagination(url);
  if (pagination instanceof NextResponse) return pagination;
  const search = parseSearchPattern(url);

  const snoozed = url.searchParams.get('snoozed');
  if (snoozed !== null && snoozed !== 'true' && snoozed !== 'false') {
    return NextResponse.json({ message: 'snoozed must be true or false' }, { status: 400 });
  }

  const snoozedFilter =
    snoozed === 'true'
      ? gte(subscribed_tvshows.snoozed_until, sql`current_date`)
      : snoozed === 'false'
        ? or(isNull(subscribed_tvshows.snoozed_until), lt(subscribed_tvshows.snoozed_until, sql`current_date`))
        : undefined;
  const filter = and(
    notExists(
      db
        .select()
        .from(watched_episodes)
        .where(and(eq(watched_episodes.episode_id, episodes.id), eq(watched_episodes.watcher_id, user.id))),
    ),
    search ? or(ilike(tvshows.name, search), ilike(episodes.name, search)) : undefined,
    snoozedFilter,
  );
  const subscription = and(eq(subscribed_tvshows.tvshow_id, tvshows.id), eq(subscribed_tvshows.watcher_id, user.id));

  const [data, [totalRow]] = await Promise.all([
    db
      .select({
        episodes,
        tvshows,
        subscription: {
          delay_days: subscribed_tvshows.delay_days,
          snoozed_until: subscribed_tvshows.snoozed_until,
        },
      })
      .from(episodes)
      .innerJoin(tvshows, eq(tvshows.id, episodes.tvshow_id))
      .innerJoin(subscribed_tvshows, subscription)
      .where(filter)
      .orderBy(
        asc(sql`${episodes.airdate} + ${subscribed_tvshows.delay_days}`),
        tvshows.name,
        episodes.season,
        episodes.episode,
        episodes.id,
      )
      .limit(pagination.limit)
      .offset(pagination.offset),
    db
      .select({ total: count() })
      .from(episodes)
      .innerJoin(tvshows, eq(tvshows.id, episodes.tvshow_id))
      .innerJoin(subscribed_tvshows, subscription)
      .where(filter),
  ]);

  return paginatedJson(data, totalRow?.total ?? 0);
}
