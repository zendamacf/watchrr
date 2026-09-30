import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isUuid } from '@/lib/db/resolve-id';
import { episodes, subscribed_tvshows, watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

async function getSubscribedEpisode(episodeIdParam: string, watcherId: string) {
  if (!isUuid(episodeIdParam)) return { error: 'bad_id' as const };

  const [episode] = await db
    .select({ id: episodes.id, tvshow_id: episodes.tvshow_id })
    .from(episodes)
    .where(eq(episodes.id, episodeIdParam))
    .limit(1);
  if (!episode) return { error: 'not_found' as const };

  const [subscription] = await db
    .select({ tvshow_id: subscribed_tvshows.tvshow_id })
    .from(subscribed_tvshows)
    .where(and(eq(subscribed_tvshows.watcher_id, watcherId), eq(subscribed_tvshows.tvshow_id, episode.tvshow_id)))
    .limit(1);
  if (!subscription) return { error: 'not_found' as const };

  return { episode };
}

/**
 * Mark an episode as watched.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ episode_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const result = await getSubscribedEpisode((await params).episode_id, user.id);
  if (result.error === 'bad_id') return NextResponse.json({ message: 'Missing ID' }, { status: 400 });
  if (result.error === 'not_found') return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .insert(watched_episodes)
    .values({ episode_id: result.episode.id, watcher_id: user.id })
    .onConflictDoNothing();

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}

/**
 * Mark an episode as unwatched.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ episode_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const result = await getSubscribedEpisode((await params).episode_id, user.id);
  if (result.error === 'bad_id') return NextResponse.json({ message: 'Missing ID' }, { status: 400 });
  if (result.error === 'not_found') return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .delete(watched_episodes)
    .where(and(eq(watched_episodes.episode_id, result.episode.id), eq(watched_episodes.watcher_id, user.id)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
