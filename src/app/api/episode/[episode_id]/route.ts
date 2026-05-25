import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isUuid, resolveEpisodeId } from '@/lib/db/resolve-id';
import { watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

/**
 * Mark an episode as watched.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ episode_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).episode_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const episodeId = await resolveEpisodeId(param);
  if (!episodeId) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db.insert(watched_episodes).values({ episode_id: episodeId, watcher_id: user.id }).onConflictDoNothing();

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
