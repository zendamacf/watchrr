import { type NextRequest, NextResponse } from 'next/server';
import { ResourceNotFound } from '@/lib/refresher/errors';
import { refreshTvShow } from '@/lib/refresher/tvshows';
import { guardUser } from '@/utils/auth';

/**
 * Refresh a TV Show's metadata & episodes.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ tvshow_id: string }> }) {
  const tvshow_id = parseInt((await params).tvshow_id, 10);
  if (Number.isNaN(tvshow_id)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await refreshTvShow(tvshow_id);
  } catch (e) {
    if (e instanceof ResourceNotFound) return NextResponse.json({ message: 'Could not find show' }, { status: 404 });
    throw e;
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
