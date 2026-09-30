import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isUuid } from '@/lib/db/resolve-id';
import { episodes, subscribed_tvshows, watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

function parseSeason(seasonParam: string): number | null {
  if (!/^\d+$/.test(seasonParam)) return null;
  const season = Number(seasonParam);
  if (!Number.isSafeInteger(season) || season < 0) return null;
  return season;
}

/**
 * Mark all episodes in a season as watched.
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ tvshow_id: string; season: string }> },
) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { tvshow_id: tvshowIdParam, season: seasonParam } = await params;
  if (!isUuid(tvshowIdParam)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const season = parseSeason(seasonParam);
  if (season === null) return NextResponse.json({ message: 'Invalid season' }, { status: 400 });

  const [subscription] = await db
    .select({ tvshow_id: subscribed_tvshows.tvshow_id })
    .from(subscribed_tvshows)
    .where(and(eq(subscribed_tvshows.watcher_id, user.id), eq(subscribed_tvshows.tvshow_id, tvshowIdParam)))
    .limit(1);
  if (!subscription) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const episodeRows = await db
    .select({ id: episodes.id })
    .from(episodes)
    .where(and(eq(episodes.tvshow_id, tvshowIdParam), eq(episodes.season, season)));

  if (episodeRows.length === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .insert(watched_episodes)
    .values(episodeRows.map((row) => ({ episode_id: row.id, watcher_id: user.id })))
    .onConflictDoNothing();

  return NextResponse.json({ message: 'Success', marked_count: episodeRows.length }, { status: 200 });
}
