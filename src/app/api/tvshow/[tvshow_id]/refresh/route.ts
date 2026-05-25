import { type NextRequest, NextResponse } from 'next/server';
import { isUuid, resolveTvshowUuid } from '@/lib/db/resolve-id';
import { ResourceNotFound } from '@/lib/refresher/errors';
import { refreshTvShow } from '@/lib/refresher/tvshows';
import { guardUser } from '@/utils/auth';

/**
 * Refresh a TV Show's metadata & episodes.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ tvshow_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).tvshow_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const tvshowUuid = await resolveTvshowUuid(param);
  if (!tvshowUuid) return NextResponse.json({ message: 'Could not find show' }, { status: 404 });

  try {
    await refreshTvShow(tvshowUuid);
  } catch (e) {
    if (e instanceof ResourceNotFound) return NextResponse.json({ message: 'Could not find show' }, { status: 404 });
    throw e;
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
