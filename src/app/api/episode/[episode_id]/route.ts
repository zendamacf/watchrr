import { db } from '@/lib/db';
import { watched_episodes } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Mark an episode as watched.
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ episode_id: number }> },
) {
  const { episode_id } = await params;

  if (!episode_id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await db
    .insert(watched_episodes)
    .values({ episode_id: episode_id, watcher_id: user.id })
    .onConflictDoNothing();

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
