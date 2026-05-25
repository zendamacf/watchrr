import '@/test/mocks/auth';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedEpisode, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { GET } from './route';

describe('GET /api/episode', () => {
  let userId: string;

  beforeEach(async () => {
    resetAuthGuardMocks();
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('returns unwatched episodes for subscribed shows', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 998_701, name: 'Episodes Show' },
    });
    await seedEpisode({
      tvshowId,
      overrides: { moviedb_id: 998_702, name: 'Unwatched Ep', season: 1, episode: 1 },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.length).toBeGreaterThan(0);
    expect(data.some((row: { episodes: { name: string } }) => row.episodes.name === 'Unwatched Ep')).toBe(true);
  });
});
