import { db } from '@/lib/db';
import { watcher_tvshows } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';
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
  if (!tvshow_id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await db
    .delete(watcher_tvshows)
    .where(and(eq(watcher_tvshows.watcher_id, user.id), eq(watcher_tvshows.tvshow_id, tvshow_id)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
