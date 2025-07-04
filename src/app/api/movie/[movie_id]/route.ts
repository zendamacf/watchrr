import { db } from '@/lib/db';
import { watcher_movies } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Mark a movie as watched.
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ movie_id: number }> },
) {
  const { movie_id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await db
    .update(watcher_movies)
    .set({ watched: true })
    .where(and(eq(watcher_movies.watcher_id, data.user.id), eq(watcher_movies.movie_id, movie_id)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
