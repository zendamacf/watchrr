import { db } from '@/lib/db';
import { episodes, tvshows, watcher_episodes } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * Get all unuwatched episodes.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const data = await db
    .select()
    .from(episodes)
    .innerJoin(tvshows, eq(tvshows.id, episodes.tvshow_id))
    .innerJoin(
      watcher_episodes,
      and(eq(watcher_episodes.episode_id, episodes.id), eq(watcher_episodes.watcher_id, user.id)),
    )
    .where(eq(watcher_episodes.watched, false))
    .orderBy(episodes.airdate, tvshows.name, episodes.season, episodes.episode);

  return NextResponse.json(data, { status: 201 });
}
