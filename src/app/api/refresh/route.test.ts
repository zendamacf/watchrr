import '@/test/mocks/refresh-db';
import '@/test/mocks/refresher';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { resetRefreshDbMock, setRefreshDbRows } from '@/test/mocks/refresh-db';
import { mockRefreshMovie, mockRefreshTvShow, resetRefresherMocks } from '@/test/mocks/refresher';
import { seedSubscribedMovie, seedSubscribedMovies, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { GET } from './route';

describe('GET /api/refresh', () => {
  beforeEach(() => {
    resetRefreshDbMock();
    resetRefresherMocks();
    mockRefreshMovie.mockResolvedValue(undefined);
    mockRefreshTvShow.mockResolvedValue(undefined);
  });

  it('returns success after refreshing subscribed media', async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    const [{ movie }, { show }] = await Promise.all([
      seedSubscribedMovie({
        watcherId: user.id,
        movie: { moviedb_id: 998_801, name: 'Cron Movie' },
        watched: false,
      }),
      seedSubscribedTvShow({
        watcherId: user.id,
        show: { moviedb_id: 998_802, name: 'Cron Show' },
      }),
    ]);

    setRefreshDbRows({
      movies: [{ movie_id: movie.id, name: movie.name }],
      shows: [{ tvshow_id: show.id, name: show.name }],
    });

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: 'Success' });
    expect(mockRefreshMovie).toHaveBeenCalledWith(movie.id);
    expect(mockRefreshTvShow).toHaveBeenCalledWith(show.id);
  });

  it('refreshes unwatched movies in chunks of 30', async () => {
    const user = await seedUser({ email: 'vitest-cron-chunk@example.com', password: seedPassword });
    const { movies: seededMovies, movieIds: seededMovieIds } = await seedSubscribedMovies({
      watcherId: user.id,
      movies: Array.from({ length: 31 }, (_, i) => ({
        moviedb_id: 997_000 + i,
        name: `Chunk Movie ${i}`,
      })),
      watched: false,
    });

    setRefreshDbRows({
      movies: seededMovies.map((m) => ({ movie_id: m.id, name: m.name })),
      shows: [],
    });

    mockRefreshMovie.mockClear();
    await GET();

    const refreshedIds = mockRefreshMovie.mock.calls.map((call) => call[0] as string);
    for (const movieId of seededMovieIds) {
      expect(refreshedIds).toContain(movieId);
    }
    expect(refreshedIds).toHaveLength(31);
  });
});
