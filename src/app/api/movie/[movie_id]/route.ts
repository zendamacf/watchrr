import { db } from '@/lib/db';
import { watcher_movies } from '@/lib/db/schema';
import { guardUser } from '@/utils/auth';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Mark a movie as watched.
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ movie_id: number }> },
) {
  const { movie_id } = await params;
  if (!movie_id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await db
    .update(watcher_movies)
    .set({ watched: true })
    .where(and(eq(watcher_movies.watcher_id, user.id), eq(watcher_movies.movie_id, movie_id)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}

/**
 * Stop subscribing to a movie.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ movie_id: number }> },
) {
  const { movie_id } = await params;
  if (!movie_id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await db
    .delete(watcher_movies)
    .where(and(eq(watcher_movies.watcher_id, user.id), eq(watcher_movies.movie_id, movie_id)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
