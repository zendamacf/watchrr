import { type NextRequest, NextResponse } from 'next/server';
import { ResourceNotFound } from '@/lib/refresher/errors';
import { refreshMovie } from '@/lib/refresher/movies';
import { guardUser } from '@/utils/auth';

/**
 * Refresh a Movies's metadata & episodes.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ movie_id: string }> }) {
  const movie_id = parseInt((await params).movie_id, 10);
  if (Number.isNaN(movie_id)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await refreshMovie(movie_id);
  } catch (e) {
    if (e instanceof ResourceNotFound) return NextResponse.json({ message: 'Could not find movie' }, { status: 404 });
    throw e;
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
