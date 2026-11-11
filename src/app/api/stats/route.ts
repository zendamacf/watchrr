import { type NextRequest, NextResponse } from 'next/server';
import { getOverallStats } from '@/lib/stats/overall';
import { parseStatsParams } from '@/lib/stats/params';
import { guardUser } from '@/utils/auth';

/**
 * Overall watch statistics for the signed-in user.
 * Query: `from`, `to` (yyyy-MM-dd) bound the activity charts; `tz` is an IANA timezone.
 */
export async function GET(request: NextRequest) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const parsed = parseStatsParams(request.nextUrl.searchParams);
  if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

  const stats = await getOverallStats({ userId: user.id, ...parsed.params });
  return NextResponse.json(stats, { status: 200 });
}
