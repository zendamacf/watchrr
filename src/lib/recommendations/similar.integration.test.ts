import { describe, expect, it } from 'vitest';
import { seedPassword } from '@/test/fixtures/user';
import { uniqueTmdbBase } from '@/test/ids';
import {
  seedMovieRecommendation,
  seedNotInterested,
  seedSubscribedMovie,
  seedSubscribedTvShow,
  seedTvShowRecommendation,
  seedUser,
} from '@/test/seeds';
import { listSimilarMovies, listSimilarShows, SIMILAR_LIMIT } from './similar';

async function setup() {
  const base = uniqueTmdbBase();
  const user = await seedUser({
    email: `vitest-recs-similar-${base}-${Date.now()}@example.com`,
    password: seedPassword,
  });
  const { movie } = await seedSubscribedMovie({
    watcherId: user.id,
    movie: { moviedb_id: base + 1, name: 'Source' },
  });
  return { base, userId: user.id, movieId: movie.id };
}

describe('listSimilarMovies', () => {
  it('returns nothing when the movie has no cached recommendations', async () => {
    const { userId, movieId } = await setup();
    expect(await listSimilarMovies(userId, movieId)).toEqual([]);
  });

  it('lists the movie’s recommendations by name', async () => {
    const { base, userId, movieId } = await setup();
    await seedMovieRecommendation({
      sourceMovieId: movieId,
      moviedb_id: base + 11,
      name: 'Bravo',
      releasedate: '2020-02-02',
    });
    await seedMovieRecommendation({ sourceMovieId: movieId, moviedb_id: base + 12, name: 'Alpha' });

    const similar = await listSimilarMovies(userId, movieId);

    expect(similar.map((m) => m.name)).toEqual(['Alpha', 'Bravo']);
    expect(similar[1]).toEqual({
      moviedb_id: base + 11,
      name: 'Bravo',
      description: 'A recommended movie',
      releasedate: '2020-02-02',
      poster_slug: '/rec-poster.jpg',
    });
  });

  it('leaves out movies the user follows or hid', async () => {
    const { base, userId, movieId } = await setup();
    await seedMovieRecommendation({ sourceMovieId: movieId, moviedb_id: base + 11, name: 'Followed' });
    await seedMovieRecommendation({ sourceMovieId: movieId, moviedb_id: base + 12, name: 'Hidden' });
    await seedMovieRecommendation({ sourceMovieId: movieId, moviedb_id: base + 13, name: 'Kept' });
    await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 11, name: 'Followed' } });
    await seedNotInterested({ watcherId: userId, type: 'movie', moviedb_id: base + 12 });

    expect((await listSimilarMovies(userId, movieId)).map((m) => m.name)).toEqual(['Kept']);
  });

  it('keeps what other users follow or hid', async () => {
    const { base, userId, movieId } = await setup();
    const other = await seedUser({
      email: `vitest-recs-similar-other-${base}-${Date.now()}@example.com`,
      password: seedPassword,
    });
    await seedMovieRecommendation({ sourceMovieId: movieId, moviedb_id: base + 11, name: 'Shared' });
    await seedSubscribedMovie({ watcherId: other.id, movie: { moviedb_id: base + 11, name: 'Shared' } });
    await seedNotInterested({ watcherId: other.id, type: 'movie', moviedb_id: base + 11 });

    expect((await listSimilarMovies(userId, movieId)).map((m) => m.name)).toEqual(['Shared']);
  });

  it('caps the list', async () => {
    const { base, userId, movieId } = await setup();
    for (let i = 0; i < SIMILAR_LIMIT + 3; i++) {
      await seedMovieRecommendation({ sourceMovieId: movieId, moviedb_id: base + 100 + i });
    }
    expect(await listSimilarMovies(userId, movieId)).toHaveLength(SIMILAR_LIMIT);
  });
});

describe('listSimilarShows', () => {
  async function setupShow() {
    const base = uniqueTmdbBase();
    const user = await seedUser({
      email: `vitest-recs-similar-show-${base}-${Date.now()}@example.com`,
      password: seedPassword,
    });
    const { show } = await seedSubscribedTvShow({
      watcherId: user.id,
      show: { moviedb_id: base + 1, name: 'Source Show' },
    });
    return { base, userId: user.id, showId: show.id };
  }

  it('returns nothing when the show has no cached recommendations', async () => {
    const { userId, showId } = await setupShow();
    expect(await listSimilarShows(userId, showId)).toEqual([]);
  });

  it('lists the show’s recommendations by name', async () => {
    const { base, userId, showId } = await setupShow();
    await seedTvShowRecommendation({ sourceTvShowId: showId, moviedb_id: base + 11, name: 'Bravo' });
    await seedTvShowRecommendation({ sourceTvShowId: showId, moviedb_id: base + 12, name: 'Alpha' });

    const similar = await listSimilarShows(userId, showId);

    expect(similar.map((s) => s.name)).toEqual(['Alpha', 'Bravo']);
    expect(similar[1]).toEqual({
      moviedb_id: base + 11,
      name: 'Bravo',
      description: 'A recommended show',
      country: 'US',
      poster_slug: '/rec-poster.jpg',
    });
  });

  it('leaves out shows the user follows or hid, but not ones only other users did', async () => {
    const { base, userId, showId } = await setupShow();
    const other = await seedUser({
      email: `vitest-recs-similar-show-other-${base}-${Date.now()}@example.com`,
      password: seedPassword,
    });
    for (const [offset, name] of [
      [11, 'Followed'],
      [12, 'Hidden'],
      [13, 'Kept'],
      [14, 'Others'],
    ] as const) {
      await seedTvShowRecommendation({ sourceTvShowId: showId, moviedb_id: base + offset, name });
    }
    await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 11, name: 'Followed' } });
    await seedNotInterested({ watcherId: userId, type: 'tvshow', moviedb_id: base + 12 });
    await seedSubscribedTvShow({ watcherId: other.id, show: { moviedb_id: base + 14, name: 'Others' } });
    await seedNotInterested({ watcherId: other.id, type: 'tvshow', moviedb_id: base + 14 });

    expect((await listSimilarShows(userId, showId)).map((s) => s.name)).toEqual(['Kept', 'Others']);
  });

  it('caps the list', async () => {
    const { base, userId, showId } = await setupShow();
    for (let i = 0; i < SIMILAR_LIMIT + 3; i++) {
      await seedTvShowRecommendation({ sourceTvShowId: showId, moviedb_id: base + 100 + i });
    }
    expect(await listSimilarShows(userId, showId)).toHaveLength(SIMILAR_LIMIT);
  });
});
