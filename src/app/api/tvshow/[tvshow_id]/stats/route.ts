import { type NextRequest, NextResponse } from 'next/server';
import { isUuid } from '@/lib/db/resolve-id';
import { parseStatsParams } from '@/lib/stats/params';
import { getShowStats } from '@/lib/stats/show';
import { guardUser } from '@/utils/auth';

/**
 * Watch statistics for one subscribed show. Query: `tz` is an IANA timezone.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ tvshow_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const tvshowId = (await params).tvshow_id;
  if (!isUuid(tvshowId)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const parsed = parseStatsParams(request.nextUrl.searchParams);
  if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

  const stats = await getShowStats({ userId: user.id, tvshowId, timezone: parsed.params.timezone });
  if (!stats) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(stats, { status: 200 });
}
