import { and, count, eq, exists, ilike, or } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { type NextRequest, NextResponse } from 'next/server';
import { paginatedJson, parsePagination, parseSearchPattern } from '@/lib/api/pagination';
import { db } from '@/lib/db';
import { movies, subscribed_movies } from '@/lib/db/schema';
import { cacheMovieRecommendationsIfMissing } from '@/lib/refresher/recommendations';
import { getMovie } from '@/lib/themoviedb/movies';
import { guardUser } from '@/utils/auth';

/**
 * Get unwatched movies currently subscribed to.
 */
export async function GET(request: NextRequest) {
  const user = await guardUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const pagination = parsePagination(url);
  if (pagination instanceof NextResponse) return pagination;
  const search = parseSearchPattern(url);

  const filter = and(
    exists(
      db
        .select()
        .from(subscribed_movies)
        .where(
          and(
            eq(subscribed_movies.movie_id, movies.id),
            eq(subscribed_movies.watcher_id, user.id),
            eq(subscribed_movies.watched, false),
          ),
        ),
    ),
    search ? or(ilike(movies.name, search), ilike(movies.description, search)) : undefined,
  );

  const [data, [totalRow]] = await Promise.all([
    db
      .select()
      .from(movies)
      .where(filter)
      .orderBy(movies.releasedate, movies.name, movies.id)
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(movies).where(filter),
  ]);

  return paginatedJson(data, totalRow?.total ?? 0);
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
        releasedate: found.releasedate ? DateTime.fromISO(found.releasedate).toSQLDate() : null,
        poster_slug: found.poster,
        backdrop_slug: found.backdrop,
        description: found.description,
        runtime: found.runtime,
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
    .values({ watcher_id: user.id, movie_id: movie.id })
    .onConflictDoUpdate({
      target: [subscribed_movies.movie_id, subscribed_movies.watcher_id],
      set: { watched: false, watched_at: null },
    });

  await cacheMovieRecommendationsIfMissing(movie);

  return NextResponse.json({ message: 'Success', movie_id: movie.id }, { status: 201 });
}
