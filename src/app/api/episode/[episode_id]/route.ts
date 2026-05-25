import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { episodes, watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

/**
 * Mark an episode as watched.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ episode_id: string }> }) {
  const episode_id = parseInt((await params).episode_id, 10);
  if (Number.isNaN(episode_id)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const [episode] = await db.select({ uuid: episodes.uuid }).from(episodes).where(eq(episodes.id, episode_id)).limit(1);
  if (!episode) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .insert(watched_episodes)
    .values({ episode_id, episode_uuid: episode.uuid, watcher_id: user.id })
    .onConflictDoNothing();

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
