import { type NextRequest, NextResponse } from 'next/server';
import { isUuid, resolveMovieUuid } from '@/lib/db/resolve-id';
import { ResourceNotFound } from '@/lib/refresher/errors';
import { refreshMovie } from '@/lib/refresher/movies';
import { guardUser } from '@/utils/auth';

/**
 * Refresh a Movies's metadata & episodes.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ movie_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).movie_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const movieUuid = await resolveMovieUuid(param);
  if (!movieUuid) return NextResponse.json({ message: 'Could not find movie' }, { status: 404 });

  try {
    await refreshMovie(movieUuid);
  } catch (e) {
    if (e instanceof ResourceNotFound) return NextResponse.json({ message: 'Could not find movie' }, { status: 404 });
    throw e;
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
