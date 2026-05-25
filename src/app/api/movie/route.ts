import { and, eq, exists } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toPublicMovie } from '@/lib/db/public-media';
import { movies, subscribed_movies } from '@/lib/db/schema';
import { getMovie } from '@/lib/themoviedb/movies';
import { guardUser } from '@/utils/auth';

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
          .from(subscribed_movies)
          .where(
            and(
              eq(subscribed_movies.movie_uuid, movies.uuid),
              eq(subscribed_movies.watcher_id, user.id),
              eq(subscribed_movies.watched, false),
            ),
          ),
      ),
    )
    .orderBy(movies.releasedate, movies.name);

  return NextResponse.json(data.map(toPublicMovie), { status: 200 });
}

/**
 * Start subscribing to a movie.
 */
export async function POST(request: NextRequest) {
  const { moviedb_id } = await request.json();
  if (!moviedb_id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let movie = (await db.select().from(movies).where(eq(movies.moviedb_id, moviedb_id)))[0];
  if (!movie) {
    const found = await getMovie(moviedb_id);
    if (!found) {
      return NextResponse.json({ message: 'Could not find movie' }, { status: 404 });
    }

    const [inserted] = await db
      .insert(movies)
      .values({
        name: found.name,
        moviedb_id: found.id,
        releasedate: DateTime.fromISO(found.releasedate).toSQLDate(),
        poster_slug: found.poster,
        backdrop_slug: found.backdrop,
        description: found.description,
      })
      .onConflictDoNothing({ target: movies.moviedb_id })
      .returning();
    movie = inserted ?? (await db.select().from(movies).where(eq(movies.moviedb_id, moviedb_id)))[0];
    if (!movie) {
      throw new Error(`Failed to insert movie ${moviedb_id}`);
    }
  }

  await db
    .insert(subscribed_movies)
    .values({ watcher_id: user.id, movie_id: movie.id, movie_uuid: movie.uuid })
    .onConflictDoUpdate({
      target: [subscribed_movies.movie_id, subscribed_movies.watcher_id],
      set: { watched: false },
    });

  return NextResponse.json({ message: 'Success', movie_uuid: movie.uuid }, { status: 201 });
}
