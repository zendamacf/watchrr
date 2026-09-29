import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isUuid } from '@/lib/db/resolve-id';
import { episodes, subscribed_tvshows, watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

/**
 * Mark an episode as watched.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ episode_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).episode_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const [episode] = await db
    .select({ id: episodes.id, tvshow_id: episodes.tvshow_id })
    .from(episodes)
    .where(eq(episodes.id, param))
    .limit(1);
  if (!episode) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const [subscription] = await db
    .select({ tvshow_id: subscribed_tvshows.tvshow_id })
    .from(subscribed_tvshows)
    .where(and(eq(subscribed_tvshows.watcher_id, user.id), eq(subscribed_tvshows.tvshow_id, episode.tvshow_id)))
    .limit(1);
  if (!subscription) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db.insert(watched_episodes).values({ episode_id: episode.id, watcher_id: user.id }).onConflictDoNothing();

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
