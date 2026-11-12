import { type NextRequest, NextResponse } from 'next/server';
import { paginatedJson, parsePagination } from '@/lib/api/pagination';
import { listRecommendations } from '@/lib/recommendations/list';
import { isRecommendationType } from '@/lib/recommendations/params';
import { guardUser } from '@/utils/auth';

/**
 * Get recommended movies and shows based on what the user tracks.
 *
 * Reads the cached TMDB recommendations only. Optional `type` (`movie` or `tvshow`).
 */
export async function GET(request: NextRequest) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const pagination = parsePagination(url);
  if (pagination instanceof NextResponse) return pagination;

  const type = url.searchParams.get('type');
  if (type !== null && !isRecommendationType(type)) {
    return NextResponse.json({ message: 'type must be movie or tvshow' }, { status: 400 });
  }

  const { data, total } = await listRecommendations({
    userId: user.id,
    type: type ?? undefined,
    ...pagination,
  });
  return paginatedJson(data, total);
}
