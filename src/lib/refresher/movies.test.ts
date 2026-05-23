import '@/test/mocks/themoviedb';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { movies } from '@/lib/db/schema';
import { mockGetMovie, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { seedMovie } from '@/test/seeds';
import { ResourceNotFound } from './errors';
import { refreshMovie } from './movies';

const MOVIedb_UNCHANGED = 999_101;
const MOVIedb_UPDATED = 999_102;

function tmdbMovie(
  moviedb_id: number,
  overrides: Partial<{
    name: string;
    description: string;
    poster: string | null;
    backdrop: string | null;
    releasedate: string;
  }> = {},
) {
  return {
    id: moviedb_id,
    name: 'Synced Title',
    description: 'Synced description',
    poster: '/synced-poster.jpg',
    backdrop: '/synced-backdrop.jpg',
    releasedate: '2024-01-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('refreshMovie', () => {
  beforeEach(() => {
    resetThemoviedbMocks();
  });

  it('throws ResourceNotFound when the movie row does not exist', async () => {
    await expect(refreshMovie(99_999_999)).rejects.toBeInstanceOf(ResourceNotFound);
    expect(mockGetMovie).not.toHaveBeenCalled();
  });

  it('skips update when DB metadata already matches TMDB', async () => {
    const movie = await seedMovie({
      moviedb_id: MOVIedb_UNCHANGED,
      name: 'Synced Title',
      description: 'Synced description',
      poster_slug: '/synced-poster.jpg',
      backdrop_slug: '/synced-backdrop.jpg',
      releasedate: '2024-01-15',
    });
    mockGetMovie.mockResolvedValue(tmdbMovie(MOVIedb_UNCHANGED));

    await refreshMovie(movie.id);

    expect(mockGetMovie).toHaveBeenCalledWith(MOVIedb_UNCHANGED);
    const [after] = await db.select().from(movies).where(eq(movies.id, movie.id));
    expect(after).toMatchObject({
      name: 'Synced Title',
      description: 'Synced description',
      poster_slug: '/synced-poster.jpg',
      backdrop_slug: '/synced-backdrop.jpg',
      releasedate: '2024-01-15',
    });
  });

  it('updates the movie row when TMDB metadata differs', async () => {
    const movie = await seedMovie({
      moviedb_id: MOVIedb_UPDATED,
      name: 'Stale Title',
      description: 'Stale description',
      poster_slug: '/old-poster.jpg',
      backdrop_slug: '/old-backdrop.jpg',
      releasedate: '2020-06-01',
    });
    mockGetMovie.mockResolvedValue(
      tmdbMovie(MOVIedb_UPDATED, {
        name: 'Fresh Title',
        description: 'Fresh description',
        poster: '/fresh-poster.jpg',
        backdrop: '/fresh-backdrop.jpg',
        releasedate: '2024-03-20T00:00:00.000Z',
      }),
    );

    await refreshMovie(movie.id);

    const [after] = await db.select().from(movies).where(eq(movies.id, movie.id));
    expect(after).toMatchObject({
      name: 'Fresh Title',
      description: 'Fresh description',
      poster_slug: '/fresh-poster.jpg',
      backdrop_slug: '/fresh-backdrop.jpg',
      releasedate: '2024-03-20',
    });
  });
});
