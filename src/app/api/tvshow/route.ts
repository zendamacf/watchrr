import { and, count, eq, ilike, isNull, or } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { paginatedJson, parsePagination, parseSearchPattern } from '@/lib/api/pagination';
import { db } from '@/lib/db';
import { subscribed_tvshows, tvshows } from '@/lib/db/schema';
import { getTvShow } from '@/lib/themoviedb/tvshows';
import { guardUser } from '@/utils/auth';
import { TMDB_TV_SHOW_STATUSES, TV_SHOW_STATUS_FILTER_ALL, TV_SHOW_STATUS_FILTER_UNKNOWN } from '@/utils/tvshowStatus';

/**
 * Get TV Shows currently subscribed to.
 */
export async function GET(request: NextRequest) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const pagination = parsePagination(url);
  if (pagination instanceof NextResponse) return pagination;
  const search = parseSearchPattern(url);

  const status = url.searchParams.get('status') ?? TV_SHOW_STATUS_FILTER_ALL;
  if (
    status !== TV_SHOW_STATUS_FILTER_ALL &&
    status !== TV_SHOW_STATUS_FILTER_UNKNOWN &&
    !(TMDB_TV_SHOW_STATUSES as readonly string[]).includes(status)
  ) {
    return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
  }

  const statusFilter =
    status === TV_SHOW_STATUS_FILTER_ALL
      ? undefined
      : status === TV_SHOW_STATUS_FILTER_UNKNOWN
        ? or(isNull(tvshows.status), eq(tvshows.status, ''))
        : eq(tvshows.status, status);
  const filter = and(
    statusFilter,
    search ? or(ilike(tvshows.name, search), ilike(tvshows.description, search)) : undefined,
  );
  const subscription = and(eq(subscribed_tvshows.tvshow_id, tvshows.id), eq(subscribed_tvshows.watcher_id, user.id));

  const [data, [totalRow]] = await Promise.all([
    db
      .select({
        id: tvshows.id,
        name: tvshows.name,
        moviedb_id: tvshows.moviedb_id,
        country: tvshows.country,
        poster_slug: tvshows.poster_slug,
        backdrop_slug: tvshows.backdrop_slug,
        description: tvshows.description,
        status: tvshows.status,
        delay_days: subscribed_tvshows.delay_days,
        snoozed_until: subscribed_tvshows.snoozed_until,
      })
      .from(tvshows)
      .innerJoin(subscribed_tvshows, subscription)
      .where(filter)
      .orderBy(tvshows.name, tvshows.id)
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(tvshows).innerJoin(subscribed_tvshows, subscription).where(filter),
  ]);

  return paginatedJson(data, totalRow?.total ?? 0);
}

/**
 * Start subscribing to a TV Show.
 */
export async function POST(request: NextRequest) {
  const { moviedb_id } = await request.json();
  if (!moviedb_id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let show = (await db.select().from(tvshows).where(eq(tvshows.moviedb_id, moviedb_id)))[0];
  if (!show) {
    const found = await getTvShow(moviedb_id);
    if (!found) {
      return NextResponse.json({ message: 'Could not find show' }, { status: 404 });
    }

    const [inserted] = await db
      .insert(tvshows)
      .values({
        name: found.name,
        moviedb_id: found.id,
        country: found.country,
        poster_slug: found.poster,
        backdrop_slug: found.backdrop,
        description: found.description,
        status: found.status,
      })
      .onConflictDoNothing({ target: tvshows.moviedb_id })
      .returning();
    show = inserted ?? (await db.select().from(tvshows).where(eq(tvshows.moviedb_id, moviedb_id)))[0];
    if (!show) {
      throw new Error(`Failed to insert show ${moviedb_id}`);
    }
  }

  await db.insert(subscribed_tvshows).values({ watcher_id: user.id, tvshow_id: show.id }).onConflictDoNothing();

  return NextResponse.json({ message: 'Success', tvshow_id: show.id }, { status: 201 });
}
