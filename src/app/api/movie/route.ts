import { db } from '@/lib/db';
import { movies, watcher_movies } from '@/lib/db/schema';
import { getMovie } from '@/lib/themoviedb/movies';
import { createClient } from '@/utils/supabase/server';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Start subscribing to a movie.
 */
export async function POST(request: NextRequest) {
  const { moviedb_id } = await request.json();
  if (!moviedb_id) {
    return NextResponse.json({ message: 'Missing ID' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

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
        releasedate: DateTime.fromJSDate(found.releaseDate).toFormat('kkkk-LL-dd'),
        poster_slug: found.poster,
        backdrop_slug: found.backdrop,
      })
      .returning({ movie_id: movies.id });
    if (!inserted) {
      throw new Error(`Failed to insert show ${moviedb_id}`);
    }
    movie_id = inserted.movie_id;
  }

  await db.insert(watcher_movies).values({ watcher_id: data.user.id, movie_id });

  return NextResponse.json({ message: 'Success' }, { status: 201 });
}
