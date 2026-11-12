import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_REGION, getRecommendationDetails, parseRegion } from '@/lib/recommendations/details';
import { isMoviedbId, isRecommendationType } from '@/lib/recommendations/params';
import { guardUser } from '@/utils/auth';

/** Details can be reused by the browser for an hour; the server keeps them for a day. */
const CACHE_CONTROL = 'private, max-age=3600';

/**
 * Get extra TMDB information about one recommendation: rating, genres, cast, trailer and where to
 * stream it. `type` (`movie` or `tvshow`) and `moviedb_id` are required; `region` (ISO 3166-1, default `US`)
 * picks the streaming providers. This is the only recommendations route that calls TMDB.
 */
export async function GET(request: NextRequest) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const type = params.get('type');
  const moviedbId = Number(params.get('moviedb_id'));
  if (!isRecommendationType(type) || !isMoviedbId(moviedbId)) {
    return NextResponse.json({ message: 'type and moviedb_id are required' }, { status: 400 });
  }

  const regionParam = params.get('region');
  const region = regionParam === null ? DEFAULT_REGION : parseRegion(regionParam);
  if (!region) return NextResponse.json({ message: 'region must be a two-letter country code' }, { status: 400 });

  try {
    const details = await getRecommendationDetails(type, moviedbId, region);
    return NextResponse.json(details, { headers: { 'Cache-Control': CACHE_CONTROL } });
  } catch {
    return NextResponse.json({ message: 'Could not load details from TMDB' }, { status: 502 });
  }
}
