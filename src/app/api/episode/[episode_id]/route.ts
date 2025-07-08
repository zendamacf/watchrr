import { db } from '@/lib/db';
import { watcher_episodes } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Mark an episode as watched.
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ episode_id: number }> },
) {
  const { episode_id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await db
    .update(watcher_episodes)
    .set({ watched: true })
    .where(
      and(
        eq(watcher_episodes.watcher_id, data.user.id),
        eq(watcher_episodes.episode_id, episode_id),
      ),
    );

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
