import { db } from '@/lib/db';
import { watcher_tvshows } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Stop subscribing to a TV Show.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tvshow_id: number }> },
) {
  const { tvshow_id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await db
    .delete(watcher_tvshows)
    .where(
      and(eq(watcher_tvshows.watcher_id, data.user.id), eq(watcher_tvshows.tvshow_id, tvshow_id)),
    );

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
