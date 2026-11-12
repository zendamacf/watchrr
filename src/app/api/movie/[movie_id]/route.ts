import { and, eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMovieGenres } from '@/lib/db/genres';
import { isUuid, resolveMovieId } from '@/lib/db/resolve-id';
import { movies, subscribed_movies } from '@/lib/db/schema';
import { listSimilarMovies } from '@/lib/recommendations/similar';
import { guardUser } from '@/utils/auth';

/**
 * A subscribed movie with its watched state, genres and similar movies (from cached recommendations).
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ movie_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).movie_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const [row] = await db
    .select({
      movie: movies,
      subscription: { watched: subscribed_movies.watched, watched_at: subscribed_movies.watched_at },
    })
    .from(movies)
    .innerJoin(
      subscribed_movies,
      and(eq(subscribed_movies.movie_id, movies.id), eq(subscribed_movies.watcher_id, user.id)),
    )
    .where(eq(movies.id, param))
    .limit(1);

  if (!row) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const [genres, similar] = await Promise.all([getMovieGenres(row.movie.id), listSimilarMovies(user.id, row.movie.id)]);

  return NextResponse.json({ ...row, genres, similar }, { status: 200 });
}

/**
 * Mark a movie as watched.
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ movie_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).movie_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const movieId = await resolveMovieId(param);
  if (!movieId) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .update(subscribed_movies)
    .set({ watched: true, watched_at: sql`coalesce(${subscribed_movies.watched_at}, now())` })
    .where(and(eq(subscribed_movies.watcher_id, user.id), eq(subscribed_movies.movie_id, movieId)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}

/**
 * Stop subscribing to a movie.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ movie_id: string }> }) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const param = (await params).movie_id;
  if (!isUuid(param)) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const movieId = await resolveMovieId(param);
  if (!movieId) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await db
    .delete(subscribed_movies)
    .where(and(eq(subscribed_movies.watcher_id, user.id), eq(subscribed_movies.movie_id, movieId)));

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}
