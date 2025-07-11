import { db } from '@/lib/db';
import { movies, watcher_movies } from '@/lib/db/schema';
import { getMovie } from '@/lib/themoviedb/movies';
import { guardUser } from '@/utils/auth';
import { and, eq, exists } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get all movies currently subscribed to.
 */
export async function GET() {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const data = await db
    .select()
    .from(movies)
    .where(
      exists(
        db
          .select()
          .from(watcher_movies)
          .where(
            and(
              eq(watcher_movies.movie_id, movies.id),
              eq(watcher_movies.watcher_id, user.id),
              eq(watcher_movies.watched, false),
            ),
          ),
      ),
    )
    .orderBy(movies.releasedate, movies.name);

  return NextResponse.json(data, { status: 200 });
}

/**
 * Start subscribing to a movie.
 */
export async function POST(request: NextRequest) {
  const { moviedb_id } = await request.json();
  if (!moviedb_id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let movie_id: number;
  const [existing] = await db.select().from(movies).where(eq(movies.moviedb_id, moviedb_id));
  if (existing) movie_id = existing.id;
  else {
    const found = await getMovie(moviedb_id);
    if (!found) {
      return NextResponse.json({ message: 'Could not find movie' }, { status: 404 });
    }

    const [inserted] = await db
      .insert(movies)
      .values({
        name: found.name,
        moviedb_id: found.id,
        releasedate: DateTime.fromISO(found.releasedate).toFormat('kkkk-LL-dd'),
        poster_slug: found.poster,
        backdrop_slug: found.backdrop,
      })
      .onConflictDoNothing()
      .returning({ movie_id: movies.id });
    if (!inserted) {
      throw new Error(`Failed to insert show ${moviedb_id}`);
    }
    movie_id = inserted.movie_id;
  }

  await db
    .insert(watcher_movies)
    .values({ watcher_id: user.id, movie_id })
    .onConflictDoUpdate({
      target: [watcher_movies.movie_id, watcher_movies.watcher_id],
      set: { watched: false },
    });

  return NextResponse.json({ message: 'Success' }, { status: 201 });
}
