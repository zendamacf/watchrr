import '@/test/mocks/refresher';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { mockRefreshMovie, mockRefreshTvShow, resetRefresherMocks } from '@/test/mocks/refresher';
import { seedSubscribedMovie, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { GET } from './route';

describe('GET /api/refresh', () => {
  beforeEach(() => {
    resetRefresherMocks();
    mockRefreshMovie.mockResolvedValue(undefined);
    mockRefreshTvShow.mockResolvedValue(undefined);
  });

  it('returns success after refreshing subscribed media', async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    await seedSubscribedMovie({
      watcherId: user.id,
      movie: { moviedb_id: 998_801, name: 'Cron Movie' },
      watched: false,
    });
    await seedSubscribedTvShow({
      watcherId: user.id,
      show: { moviedb_id: 998_802, name: 'Cron Show' },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: 'Success' });
    expect(mockRefreshMovie).toHaveBeenCalled();
    expect(mockRefreshTvShow).toHaveBeenCalled();
  });

  it('refreshes unwatched movies in chunks of 30', async () => {
    const user = await seedUser({ email: 'vitest-cron-chunk@example.com', password: seedPassword });
    const seededMovieIds: string[] = [];
    for (let i = 0; i < 31; i++) {
      const { movie } = await seedSubscribedMovie({
        watcherId: user.id,
        movie: { moviedb_id: 997_000 + i, name: `Chunk Movie ${i}` },
        watched: false,
      });
      seededMovieIds.push(movie.id);
    }

    mockRefreshMovie.mockClear();
    await GET();

    const refreshedIds = mockRefreshMovie.mock.calls.map((call) => call[0] as string);
    for (const movieId of seededMovieIds) {
      expect(refreshedIds).toContain(movieId);
    }
    expect(refreshedIds.filter((id) => seededMovieIds.includes(id))).toHaveLength(31);
  }, 30_000);
});
