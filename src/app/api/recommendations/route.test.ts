import '@/test/mocks/auth';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiRoutes } from '@/lib/routes';
import { seedPassword } from '@/test/fixtures/user';
import { nextGet } from '@/test/helpers/api-request';
import { mockGuardUser, resetAuthGuardMocks } from '@/test/mocks/auth';
import {
  seedMovieRecommendation,
  seedNotInterested,
  seedSubscribedMovie,
  seedSubscribedTvShow,
  seedTvShowRecommendation,
  seedUser,
} from '@/test/seeds';
import { GET } from './route';

const BASE = 963_000;

describe('GET /api/recommendations', () => {
  beforeEach(() => {
    resetAuthGuardMocks();
  });

  const newUser = async (name: string) =>
    (await seedUser({ email: `vitest-recs-api-${name}-${Date.now()}@example.com`, password: seedPassword })).id;

  it('returns 401 when not authenticated', async () => {
    mockGuardUser.mockResolvedValue(null);
    const response = await GET(nextGet(apiRoutes.recommendations()));
    expect(response.status).toBe(401);
  });

  it('returns an empty list for a user with no subscriptions', async () => {
    mockGuardUser.mockResolvedValue({ id: await newUser('empty') });

    const response = await GET(nextGet(apiRoutes.recommendations()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(response.headers.get('X-Total-Count')).toBe('0');
  });

  it('returns recommendations for a user with subscriptions, excluding hidden and tracked items', async () => {
    const userId = await newUser('list');
    mockGuardUser.mockResolvedValue({ id: userId });
    const { movie } = await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: BASE + 1, name: 'Source' } });
    const { show } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: BASE + 2, name: 'Source Show' },
    });
    await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: BASE + 10, name: 'Shown' });
    await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: BASE + 11, name: 'Hidden' });
    await seedTvShowRecommendation({ sourceTvShowId: show.id, moviedb_id: BASE + 20, name: 'Shown Show' });
    await seedNotInterested({ watcherId: userId, type: 'movie', moviedb_id: BASE + 11 });

    const response = await GET(nextGet(apiRoutes.recommendations()));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { name: string; type: string; because: string }[];
    expect(body.map((r) => [r.type, r.name, r.because])).toEqual([
      ['movie', 'Shown', 'Source'],
      ['tvshow', 'Shown Show', 'Source Show'],
    ]);
    expect(response.headers.get('X-Total-Count')).toBe('2');
  });

  it('filters by type', async () => {
    const userId = await newUser('type');
    mockGuardUser.mockResolvedValue({ id: userId });
    const { movie } = await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: BASE + 31 } });
    const { show } = await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: BASE + 32 } });
    await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: BASE + 40 });
    await seedTvShowRecommendation({ sourceTvShowId: show.id, moviedb_id: BASE + 41 });

    const response = await GET(nextGet(apiRoutes.recommendations(), { type: 'tvshow' }));

    const body = (await response.json()) as { type: string }[];
    expect(body.map((r) => r.type)).toEqual(['tvshow']);
    expect(response.headers.get('X-Total-Count')).toBe('1');
  });

  it('paginates with a stable total', async () => {
    const userId = await newUser('page');
    mockGuardUser.mockResolvedValue({ id: userId });
    const { movie } = await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: BASE + 51 } });
    for (let i = 0; i < 3; i++) {
      await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: BASE + 60 + i, name: `Paged ${i}` });
    }

    const first = await GET(nextGet(apiRoutes.recommendations(), { limit: '2', offset: '0' }));
    const second = await GET(nextGet(apiRoutes.recommendations(), { limit: '2', offset: '2' }));

    const names = [...(await first.json()), ...(await second.json())].map((r: { name: string }) => r.name);
    expect(names).toEqual(['Paged 0', 'Paged 1', 'Paged 2']);
    expect(first.headers.get('X-Total-Count')).toBe('3');
    expect(second.headers.get('X-Total-Count')).toBe('3');
  });

  it('returns 400 for an invalid type', async () => {
    mockGuardUser.mockResolvedValue({ id: await newUser('badtype') });
    const response = await GET(nextGet(apiRoutes.recommendations(), { type: 'episode' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid pagination', async () => {
    mockGuardUser.mockResolvedValue({ id: await newUser('badpage') });
    const response = await GET(nextGet(apiRoutes.recommendations(), { limit: '0' }));
    expect(response.status).toBe(400);
  });
});
