import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isUuid, resolveTvshowId } from '@/lib/db/resolve-id';
import { subscribed_tvshows } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';
import { MAX_DELAY_DAYS } from '@/utils/episode-schedule';

type PreferencesBody = {
  delay_days?: number;
  snoozed_until?: string | null;
};

function parsePreferencesBody(body: PreferencesBody) {
  const updates: Partial<{ delay_days: number; snoozed_until: string | null }> = {};

  if (body.delay_days !== undefined) {
    if (!Number.isInteger(body.delay_days) || body.delay_days < 0 || body.delay_days > MAX_DELAY_DAYS) {
      return { error: `delay_days must be an integer between 0 and ${MAX_DELAY_DAYS}` };
    }
    updates.delay_days = body.delay_days;
  }

  if (body.snoozed_until !== undefined) {
    if (body.snoozed_until === null) {
      updates.snoozed_until = null;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(body.snoozed_until)) {
      return { error: 'snoozed_until must be a date in YYYY-MM-DD format or null' };
    } else {
      updates.snoozed_until = body.snoozed_until;
    }
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'No valid preferences provided' };
  }

  return { updates };
}

/**
 * Update per-user show subscription preferences.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tvshow_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).tvshow_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const tvshowId = await resolveTvshowId(param);
  if (!tvshowId) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const body = (await request.json()) as PreferencesBody;
  const parsed = parsePreferencesBody(body);
  if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

  const [updated] = await db
    .update(subscribed_tvshows)
    .set(parsed.updates)
    .where(and(eq(subscribed_tvshows.watcher_id, user.id), eq(subscribed_tvshows.tvshow_id, tvshowId)))
    .returning({
      delay_days: subscribed_tvshows.delay_days,
      snoozed_until: subscribed_tvshows.snoozed_until,
    });

  if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  return NextResponse.json(updated, { status: 200 });
}

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
