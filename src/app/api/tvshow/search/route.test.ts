import '@/test/mocks/auth';
import '@/test/mocks/themoviedb';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextGet } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockSearchTvShows, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { seedUser } from '@/test/seeds';
import { GET } from './route';

describe('GET /api/tvshow/search', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    userId = user.id;
  });

  beforeEach(() => {
    resetAuthGuardMocks();
    resetThemoviedbMocks();
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  it('returns an empty array when q is missing or blank', async () => {
    const response = await GET(nextGet(apiRoutes.tvshowSearch('q=')));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
    expect(mockSearchTvShows).not.toHaveBeenCalled();
  });

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await GET(nextGet(apiRoutes.tvshowSearch('q=thrones')));
    expect(response.status).toBe(401);
  });

  it('returns search results from TMDB', async () => {
    const results = [
      {
        id: 1399,
        name: 'Thrones',
        description: null,
        country: 'US',
        firstAirDate: '2011-04-17T00:00:00.000Z',
        poster: null,
        backdrop: null,
      },
    ];
    mockSearchTvShows.mockResolvedValue(results);
    const response = await GET(nextGet(apiRoutes.tvshowSearch('q=thrones')));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(results);
    expect(mockSearchTvShows).toHaveBeenCalledWith('thrones');
  });
});
