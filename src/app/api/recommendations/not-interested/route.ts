import { type NextRequest, NextResponse } from 'next/server';
import { markNotInterested, unmarkNotInterested } from '@/lib/recommendations/list';
import { isMoviedbId, isRecommendationType } from '@/lib/recommendations/params';
import { guardUser } from '@/utils/auth';

/**
 * Hide a recommendation from the user's Discover list.
 */
export async function POST(request: NextRequest) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { type, moviedb_id } = body ?? {};
  if (!isRecommendationType(type) || !isMoviedbId(moviedb_id)) {
    return NextResponse.json({ message: 'type and moviedb_id are required' }, { status: 400 });
  }

  await markNotInterested(user.id, type, moviedb_id);
  return NextResponse.json({ message: 'Success' }, { status: 201 });
}

/**
 * Undo hiding a recommendation. Takes `type` and `moviedb_id` as query params.
 */
export async function DELETE(request: NextRequest) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const type = params.get('type');
  const moviedbId = Number(params.get('moviedb_id'));
  if (!isRecommendationType(type) || !isMoviedbId(moviedbId)) {
    return NextResponse.json({ message: 'type and moviedb_id are required' }, { status: 400 });
  }

  await unmarkNotInterested(user.id, type, moviedbId);
  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
