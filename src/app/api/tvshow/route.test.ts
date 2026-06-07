import '@/test/mocks/auth';
import '@/test/mocks/themoviedb';
import { and, eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_tvshows } from '@/lib/db/schema';
import { apiRoutes } from '@/lib/routes';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { nextPost } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { mockGetTvShow, resetThemoviedbMocks } from '@/test/mocks/themoviedb';
import { seedSubscribedTvShow, seedTvShow, seedUser } from '@/test/seeds';
import { GET, POST } from './route';

describe('/api/tvshow', () => {
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

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it('returns subscribed shows', async () => {
      const { show } = await seedSubscribedTvShow({
        watcherId: userId,
        show: { moviedb_id: 998_601, name: 'My Show' },
      });
      const response = await GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.some((s: { id: string }) => s.id === show.id)).toBe(true);
    });
  });

  describe('POST', () => {
    it('returns 400 when moviedb_id is missing', async () => {
      const response = await POST(nextPost(apiRoutes.tvshow, {}));
      expect(response.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await POST(nextPost(apiRoutes.tvshow, { moviedb_id: 1 }));
      expect(response.status).toBe(401);
    });

    it('returns 404 when TMDB has no show', async () => {
      mockGetTvShow.mockResolvedValue(null);
      const response = await POST(nextPost(apiRoutes.tvshow, { moviedb_id: 998_602 }));
      expect(response.status).toBe(404);
    });

    it('subscribes using an existing show row', async () => {
      const show = await seedTvShow({ moviedb_id: 998_603, name: 'Existing Show' });
      const response = await POST(nextPost(apiRoutes.tvshow, { moviedb_id: show.moviedb_id }));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.tvshow_id).toBe(show.id);
      expect(mockGetTvShow).not.toHaveBeenCalled();
    });

    it('inserts a new show from TMDB and subscribes', async () => {
      const moviedbId = 910_000_000 + Math.floor(Math.random() * 1_000_000);
      mockGetTvShow.mockResolvedValue({
        id: moviedbId,
        name: 'New Show',
        description: 'Overview',
        country: 'US',
        firstAirDate: '2020-01-01T00:00:00.000Z',
        poster: '/p.jpg',
        backdrop: '/b.jpg',
      });
      const response = await POST(nextPost(apiRoutes.tvshow, { moviedb_id: moviedbId }));
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(mockGetTvShow).toHaveBeenCalledWith(moviedbId);

      const [row] = await db
        .select()
        .from(subscribed_tvshows)
        .where(and(eq(subscribed_tvshows.watcher_id, userId), eq(subscribed_tvshows.tvshow_id, body.tvshow_id)));
      expect(row).toBeDefined();
    });
  });
});
