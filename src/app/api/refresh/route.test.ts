import '@/test/mocks/refresh-db';
import '@/test/mocks/refresher';
import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { resetRefreshDbMock, setRefreshDbRows } from '@/test/mocks/refresh-db';
import { mockRefreshMovie, mockRefreshTvShow, resetRefresherMocks } from '@/test/mocks/refresher';
import { seedSubscribedMovie, seedSubscribedMovies, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { GET } from './route';

const CRON_SECRET = 'test-secret';

const makeRequest = (authorization?: string): NextRequest =>
  new Request('http://localhost/api/refresh', {
    headers: authorization ? { Authorization: authorization } : {},
  }) as NextRequest;

describe('GET /api/refresh', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = CRON_SECRET;
    resetRefreshDbMock();
    resetRefresherMocks();
    mockRefreshMovie.mockResolvedValue(undefined);
    mockRefreshTvShow.mockResolvedValue(undefined);
  });

  it('returns 401 without a valid bearer token', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(mockRefreshMovie).not.toHaveBeenCalled();
    expect(mockRefreshTvShow).not.toHaveBeenCalled();
  });

  it('returns 401 with an invalid bearer token', async () => {
    const response = await GET(makeRequest('Bearer wrong'));

    expect(response.status).toBe(401);
    expect(mockRefreshMovie).not.toHaveBeenCalled();
  });

  it('throws when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET;

    await expect(GET(makeRequest(`Bearer ${CRON_SECRET}`))).rejects.toThrow('CRON_SECRET is not set');
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

    const response = await GET(makeRequest(`Bearer ${CRON_SECRET}`));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: 'Success' });
    expect(mockRefreshMovie).toHaveBeenCalledWith(movie.id);
    expect(mockRefreshTvShow).toHaveBeenCalledWith(show.id);
  }, 30_000);

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
    await GET(makeRequest(`Bearer ${CRON_SECRET}`));

    const refreshedIds = mockRefreshMovie.mock.calls.map((call) => call[0] as string);
    for (const movieId of seededMovieIds) {
      expect(refreshedIds).toContain(movieId);
    }
    expect(refreshedIds).toHaveLength(31);
  }, 30_000);
});
