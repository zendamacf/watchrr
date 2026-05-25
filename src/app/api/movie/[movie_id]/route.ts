import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isMediaIdParam, resolveMovieId } from '@/lib/db/resolve-id';
import { subscribed_movies } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';

/**
 * Mark a movie as watched.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ movie_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).movie_id;
  if (!isMediaIdParam(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const resolved = await resolveMovieId(param);
  if (!resolved) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .update(subscribed_movies)
    .set({ watched: true })
    .where(and(eq(subscribed_movies.watcher_id, user.id), eq(subscribed_movies.movie_id, resolved.id)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}

/**
 * Stop subscribing to a movie.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ movie_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).movie_id;
  if (!isMediaIdParam(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const resolved = await resolveMovieId(param);
  if (!resolved) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .delete(subscribed_movies)
    .where(and(eq(subscribed_movies.watcher_id, user.id), eq(subscribed_movies.movie_id, resolved.id)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
