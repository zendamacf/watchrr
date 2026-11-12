import '@/test/mocks/auth';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { listRecommendations } from '@/lib/recommendations/list';
import { apiRoutes } from '@/lib/routes';
import { seedPassword } from '@/test/fixtures/user';
import { nextDelete, nextPost } from '@/test/helpers/api-request';
import { uniqueTmdbBase } from '@/test/ids';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import { seedMovieRecommendation, seedSubscribedMovie, seedUser } from '@/test/seeds';
import { DELETE, POST } from './route';

const BASE = uniqueTmdbBase();

describe('/api/recommendations/not-interested', () => {
  let userId: string;

  beforeEach(async () => {
    resetAuthGuardMocks();
    userId = (
      await seedUser({ email: `vitest-ni-api-${Date.now()}-${Math.random()}@example.com`, password: seedPassword })
    ).id;
    mockGuardUser.mockResolvedValue({ id: userId });
  });

  const visible = async () => (await listRecommendations({ userId, limit: 100, offset: 0 })).data;

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await POST(nextPost(apiRoutes.notInterested, { type: 'movie', moviedb_id: BASE }));
      expect(response.status).toBe(401);
    });

    it.each([
      [{}],
      [{ type: 'movie' }],
      [{ moviedb_id: BASE }],
      [{ type: 'episode', moviedb_id: BASE }],
      [{ type: 'movie', moviedb_id: 'abc' }],
      [{ type: 'movie', moviedb_id: -5 }],
    ])('returns 400 for invalid body %j', async (body) => {
      const response = await POST(nextPost(apiRoutes.notInterested, body));
      expect(response.status).toBe(400);
    });

    it('returns 400 when the body is not JSON', async () => {
      const request = new NextRequest(new URL(apiRoutes.notInterested, 'http://localhost'), {
        method: 'POST',
        body: 'not json',
      });
      expect((await POST(request)).status).toBe(400);
    });

    it('hides the recommendation and is repeatable', async () => {
      const { movie } = await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: BASE + 1 } });
      await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: BASE + 10 });
      expect(await visible()).toHaveLength(1);

      const first = await POST(nextPost(apiRoutes.notInterested, { type: 'movie', moviedb_id: BASE + 10 }));
      const second = await POST(nextPost(apiRoutes.notInterested, { type: 'movie', moviedb_id: BASE + 10 }));

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
      expect(await visible()).toEqual([]);
    });
  });

  describe('DELETE', () => {
    const url = (type: string, id: string) => `${apiRoutes.notInterested}?type=${type}&moviedb_id=${id}`;

    it('returns 401 when not authenticated', async () => {
      mockGuardUser.mockResolvedValue(null);
      const response = await DELETE(nextDelete(url('movie', String(BASE))));
      expect(response.status).toBe(401);
    });

    it.each([
      ['episode', String(BASE)],
      ['movie', 'abc'],
      ['movie', '0'],
      ['movie', ''],
    ])('returns 400 for type=%s moviedb_id=%s', async (type, id) => {
      const response = await DELETE(nextDelete(url(type, id)));
      expect(response.status).toBe(400);
    });

    it('brings the recommendation back', async () => {
      const { movie } = await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: BASE + 21 } });
      await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: BASE + 30 });
      await POST(nextPost(apiRoutes.notInterested, { type: 'movie', moviedb_id: BASE + 30 }));
      expect(await visible()).toEqual([]);

      const response = await DELETE(nextDelete(url('movie', String(BASE + 30))));

      expect(response.status).toBe(200);
      expect(await visible()).toHaveLength(1);
    });
  });
});
