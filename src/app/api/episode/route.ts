import { db } from '@/lib/db';
import { episodes, subscribed_tvshows, tvshows, watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';
import { and, eq, notExists } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * Get all unuwatched episodes.
 */
export async function GET() {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const data = await db
    .select()
    .from(episodes)
    .innerJoin(tvshows, eq(tvshows.id, episodes.tvshow_id))
    .innerJoin(
      subscribed_tvshows,
      and(eq(subscribed_tvshows.tvshow_id, tvshows.id), eq(subscribed_tvshows.watcher_id, user.id)),
    )
    .where(
      notExists(
        db
          .select()
          .from(watched_episodes)
          .where(
            and(
              eq(watched_episodes.episode_id, episodes.id),
              eq(watched_episodes.watcher_id, user.id),
            ),
          ),
      ),
    )
    .orderBy(episodes.airdate, tvshows.name, episodes.season, episodes.episode);

  return NextResponse.json(data, { status: 200 });
}
