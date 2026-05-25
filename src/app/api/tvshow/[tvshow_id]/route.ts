import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isUuid, resolveTvshowId } from '@/lib/db/resolve-id';
import { subscribed_tvshows } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

/**
 * Stop subscribing to a TV Show.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ tvshow_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).tvshow_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const tvshowId = await resolveTvshowId(param);
  if (!tvshowId) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .delete(subscribed_tvshows)
    .where(and(eq(subscribed_tvshows.watcher_id, user.id), eq(subscribed_tvshows.tvshow_id, tvshowId)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
