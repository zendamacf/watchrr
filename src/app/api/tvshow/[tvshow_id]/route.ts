import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribed_tvshows } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

/**
 * Stop subscribing to a TV Show.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ tvshow_id: string }> }) {
  const tvshow_id = parseInt((await params).tvshow_id, 10);
  if (Number.isNaN(tvshow_id)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await db
    .delete(subscribed_tvshows)
    .where(and(eq(subscribed_tvshows.watcher_id, user.id), eq(subscribed_tvshows.tvshow_id, tvshow_id)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
