import { eq } from 'drizzle-orm';
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
