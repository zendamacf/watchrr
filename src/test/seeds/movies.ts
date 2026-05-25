import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { movies, subscribed_movies } from '@/lib/db/schema';
import { testMovie } from '@/test/fixtures/movie';
import type { Movie } from '@/types';

export async function seedMovie(overrides: Partial<typeof testMovie> = {}): Promise<Movie> {
  const values = { ...testMovie, ...overrides };

  const [existing] = await db.select().from(movies).where(eq(movies.moviedb_id, values.moviedb_id)).limit(1);
  if (existing) return existing;

  const [inserted] = await db
    .insert(movies)
    .values({
      name: values.name,
      moviedb_id: values.moviedb_id,
      releasedate: values.releasedate,
      poster_slug: values.poster_slug,
      backdrop_slug: values.backdrop_slug,
      description: values.description,
    })
    .returning();

  if (!inserted) {
    throw new Error(`Failed to seed movie ${values.moviedb_id}`);
  }

  return inserted;
}

export async function seedSubscribedMovie(options: {
  watcherId: string;
  movie?: Partial<typeof testMovie>;
  watched?: boolean;
}): Promise<{ movie: Movie; movieId: string }> {
  const movie = await seedMovie(options.movie ?? {});
  await db
    .insert(subscribed_movies)
    .values({
      watcher_id: options.watcherId,
      movie_id: movie.id,
      watched: options.watched ?? false,
    })
    .onConflictDoNothing();

  return { movie, movieId: movie.id };
}

/**
 * Insert many movies and subscriptions in two round trips (idempotent on moviedb_id / PK).
 */
export async function seedSubscribedMovies(options: {
  watcherId: string;
  movies: Partial<typeof testMovie>[];
  watched?: boolean;
}): Promise<{ movies: Movie[]; movieIds: string[] }> {
  const rows = options.movies.map((overrides, i) => {
    const merged = { ...testMovie, ...overrides };
    return {
      name: merged.name ?? `Test Movie ${i}`,
      moviedb_id: merged.moviedb_id,
      releasedate: merged.releasedate,
      poster_slug: merged.poster_slug,
      backdrop_slug: merged.backdrop_slug,
      description: merged.description,
    };
  });

  const moviedbIds = rows.map((r) => r.moviedb_id);

  await db.insert(movies).values(rows).onConflictDoNothing({ target: movies.moviedb_id });

  const seeded = await db.select().from(movies).where(inArray(movies.moviedb_id, moviedbIds));

  if (seeded.length !== moviedbIds.length) {
    throw new Error(`Expected ${moviedbIds.length} movies, found ${seeded.length}`);
  }

  await db
    .insert(subscribed_movies)
    .values(
      seeded.map((movie) => ({
        watcher_id: options.watcherId,
        movie_id: movie.id,
        watched: options.watched ?? false,
      })),
    )
    .onConflictDoNothing();

  return { movies: seeded, movieIds: seeded.map((m) => m.id) };
}
