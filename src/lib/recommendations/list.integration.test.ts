import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { subscribed_movies, watched_episodes } from '@/lib/db/schema';
import { seedPassword } from '@/test/fixtures/user';
import { uniqueTmdbBase } from '@/test/ids';
import {
  seedEpisode,
  seedMovieRecommendation,
  seedNotInterested,
  seedSubscribedMovie,
  seedSubscribedTvShow,
  seedTvShowRecommendation,
  seedUser,
} from '@/test/seeds';
import { listRecommendations, markNotInterested, unmarkNotInterested } from './list';
import { scoreRecommendation } from './score';

// Each test uses its own user and TMDB id block so shared, uncleaned data cannot interfere.
async function setup() {
  const base = uniqueTmdbBase();
  const user = await seedUser({ email: `vitest-recs-list-${base}-${Date.now()}@example.com`, password: seedPassword });
  return { base, userId: user.id };
}

const opts = (userId: string, extra: Partial<Parameters<typeof listRecommendations>[0]> = {}) => ({
  userId,
  limit: 100,
  offset: 0,
  ...extra,
});

describe('listRecommendations', () => {
  it('returns nothing for a user with no subscriptions', async () => {
    const { userId } = await setup();
    expect(await listRecommendations(opts(userId))).toEqual({ data: [], total: 0 });
  });

  it('recommends movies and shows from tracked items with a "because" source', async () => {
    const { base, userId } = await setup();
    const { movie } = await seedSubscribedMovie({
      watcherId: userId,
      movie: { moviedb_id: base + 1, name: 'Source M' },
    });
    const { show } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: base + 2, name: 'Source S' },
    });
    await seedMovieRecommendation({
      sourceMovieId: movie.id,
      moviedb_id: base + 10,
      name: 'Rec M',
      releasedate: '2021-06-01',
    });
    await seedTvShowRecommendation({ sourceTvShowId: show.id, moviedb_id: base + 20, name: 'Rec S' });

    const { data, total } = await listRecommendations(opts(userId));

    expect(total).toBe(2);
    expect(data).toEqual([
      expect.objectContaining({
        type: 'movie',
        moviedb_id: base + 10,
        name: 'Rec M',
        releasedate: '2021-06-01',
        country: null,
        because: ['Source M'],
        because_more: 0,
        score: 1,
      }),
      expect.objectContaining({
        type: 'tvshow',
        moviedb_id: base + 20,
        name: 'Rec S',
        releasedate: null,
        country: 'US',
        because: ['Source S'],
        because_more: 0,
        score: 1,
      }),
    ]);
  });

  it('filters by type', async () => {
    const { base, userId } = await setup();
    const { movie } = await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1 } });
    const { show } = await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 2 } });
    await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: base + 10 });
    await seedTvShowRecommendation({ sourceTvShowId: show.id, moviedb_id: base + 20 });

    const movies = await listRecommendations(opts(userId, { type: 'movie' }));
    const shows = await listRecommendations(opts(userId, { type: 'tvshow' }));

    expect(movies.data.map((r) => r.type)).toEqual(['movie']);
    expect(movies.total).toBe(1);
    expect(shows.data.map((r) => r.type)).toEqual(['tvshow']);
    expect(shows.total).toBe(1);
  });

  it('adds a point per distinct recommending source and ranks higher scores first', async () => {
    const { base, userId } = await setup();
    const a = (await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1, name: 'A' } })).movie;
    const b = (await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 2, name: 'B' } })).movie;
    await seedMovieRecommendation({ sourceMovieId: a.id, moviedb_id: base + 10, name: 'Single' });
    await seedMovieRecommendation({ sourceMovieId: a.id, moviedb_id: base + 11, name: 'Double' });
    await seedMovieRecommendation({ sourceMovieId: b.id, moviedb_id: base + 11, name: 'Double' });

    const { data } = await listRecommendations(opts(userId));

    expect(data.map((r) => [r.name, r.score])).toEqual([
      ['Double', scoreRecommendation([{ finished: false }, { finished: false }])],
      ['Single', scoreRecommendation([{ finished: false }])],
    ]);
  });

  it('weights finished movies higher and credits the heaviest source', async () => {
    const { base, userId } = await setup();
    const unwatched = (
      await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1, name: 'Aaa Unwatched' } })
    ).movie;
    const finished = (
      await seedSubscribedMovie({
        watcherId: userId,
        movie: { moviedb_id: base + 2, name: 'Zzz Finished' },
        watched: true,
      })
    ).movie;
    await seedMovieRecommendation({ sourceMovieId: unwatched.id, moviedb_id: base + 10, name: 'Both' });
    await seedMovieRecommendation({ sourceMovieId: finished.id, moviedb_id: base + 10, name: 'Both' });
    await seedMovieRecommendation({ sourceMovieId: unwatched.id, moviedb_id: base + 11, name: 'Only Unwatched' });
    await seedMovieRecommendation({ sourceMovieId: finished.id, moviedb_id: base + 12, name: 'Only Finished' });

    const { data } = await listRecommendations(opts(userId));
    const byName = Object.fromEntries(data.map((r) => [r.name, r]));

    expect(byName.Both?.score).toBe(scoreRecommendation([{ finished: false }, { finished: true }]));
    expect(byName.Both?.because).toEqual(['Zzz Finished', 'Aaa Unwatched']);
    expect(byName['Only Finished']?.score).toBe(scoreRecommendation([{ finished: true }]));
    expect(byName['Only Unwatched']?.score).toBe(scoreRecommendation([{ finished: false }]));
    expect(data.map((r) => r.name)).toEqual(['Both', 'Only Finished', 'Only Unwatched']);
  });

  it('names up to three sources, strongest first, and counts the rest', async () => {
    const { base, userId } = await setup();
    const finished = (
      await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1, name: 'Finished' }, watched: true })
    ).movie;
    const track = async (offset: number, name: string) =>
      (await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + offset, name } })).movie;
    const delta = await track(2, 'Delta');
    const sources = [finished, delta, await track(3, 'Alpha'), await track(4, 'Charlie'), await track(5, 'Bravo')];
    for (const source of sources) {
      await seedMovieRecommendation({ sourceMovieId: source.id, moviedb_id: base + 10, name: 'Popular' });
    }
    await seedMovieRecommendation({ sourceMovieId: delta.id, moviedb_id: base + 11, name: 'Niche' });

    const { data } = await listRecommendations(opts(userId));
    const byName = Object.fromEntries(data.map((r) => [r.name, r]));

    // The finished source weighs most; ties fall back to name.
    expect(byName.Popular?.because).toEqual(['Finished', 'Alpha', 'Bravo']);
    expect(byName.Popular?.because_more).toBe(2);
    expect(byName.Niche?.because).toEqual(['Delta']);
    expect(byName.Niche?.because_more).toBe(0);
  });

  it('treats a show as finished only when every aired episode is watched', async () => {
    const { base, userId } = await setup();
    const past = DateTime.utc().minus({ days: 30 }).toISODate() as string;
    const future = DateTime.utc().plus({ days: 30 }).toISODate() as string;
    const done = (await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 1, name: 'Done' } })).show;
    const partial = (await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 2, name: 'Partial' } }))
      .show;
    const untouched = (
      await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 3, name: 'Untouched' } })
    ).show;

    const watch = async (episodeId: string) => {
      await db.insert(watched_episodes).values({ episode_id: episodeId, watcher_id: userId }).onConflictDoNothing();
    };
    const doneAired = await seedEpisode({ tvshowId: done.id, overrides: { moviedb_id: base + 51, airdate: past } });
    await seedEpisode({ tvshowId: done.id, overrides: { moviedb_id: base + 52, airdate: future } });
    await watch(doneAired.id);
    const partialWatched = await seedEpisode({
      tvshowId: partial.id,
      overrides: { moviedb_id: base + 53, airdate: past },
    });
    await seedEpisode({ tvshowId: partial.id, overrides: { moviedb_id: base + 54, airdate: past } });
    await watch(partialWatched.id);
    await seedEpisode({ tvshowId: untouched.id, overrides: { moviedb_id: base + 55, airdate: past } });

    await seedTvShowRecommendation({ sourceTvShowId: done.id, moviedb_id: base + 10, name: 'From Done' });
    await seedTvShowRecommendation({ sourceTvShowId: partial.id, moviedb_id: base + 11, name: 'From Partial' });
    await seedTvShowRecommendation({ sourceTvShowId: untouched.id, moviedb_id: base + 12, name: 'From Untouched' });

    const { data } = await listRecommendations(opts(userId, { type: 'tvshow' }));
    const scores = Object.fromEntries(data.map((r) => [r.name, r.score]));

    expect(scores['From Done']).toBe(scoreRecommendation([{ finished: true }]));
    expect(scores['From Partial']).toBe(scoreRecommendation([{ finished: false }]));
    expect(scores['From Untouched']).toBe(scoreRecommendation([{ finished: false }]));
  });

  it('excludes items the user already tracks, including watched ones', async () => {
    const { base, userId } = await setup();
    const source = (await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1 } })).movie;
    const showSource = (await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 2 } })).show;
    await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 10, name: 'Tracked' }, watched: true });
    await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 20, name: 'Tracked Show' } });
    await seedMovieRecommendation({ sourceMovieId: source.id, moviedb_id: base + 10 });
    await seedMovieRecommendation({ sourceMovieId: source.id, moviedb_id: base + 11, name: 'Fresh' });
    await seedTvShowRecommendation({ sourceTvShowId: showSource.id, moviedb_id: base + 20 });

    const { data } = await listRecommendations(opts(userId));

    expect(data.map((r) => r.name)).toEqual(['Fresh']);
  });

  it("includes an item only another user tracks, and only uses the user's own sources", async () => {
    const { base, userId } = await setup();
    const other = await seedUser({ email: `vitest-recs-other-${base}@example.com`, password: seedPassword });
    const source = (await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1 } })).movie;
    const { movie: tracked } = await seedSubscribedMovie({ watcherId: other.id, movie: { moviedb_id: base + 10 } });
    await seedMovieRecommendation({ sourceMovieId: source.id, moviedb_id: base + 10, name: 'Other Tracks' });
    // The other user's recommendation sources must not leak into this user's list.
    await seedMovieRecommendation({ sourceMovieId: tracked.id, moviedb_id: base + 99, name: 'Leak' });

    const { data } = await listRecommendations(opts(userId));
    expect(data.map((r) => r.name)).toEqual(['Other Tracks']);

    // Once the user tracks it, it is excluded, and its own recommendations now count as the user's.
    await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 10 } });
    expect((await listRecommendations(opts(userId))).data.map((r) => r.name)).toEqual(['Leak']);

    await db.delete(subscribed_movies).where(eq(subscribed_movies.watcher_id, userId));
    expect((await listRecommendations(opts(userId))).data).toEqual([]);
  });

  it('excludes items the user marked not interested, per user and per type', async () => {
    const { base, userId } = await setup();
    const other = await seedUser({ email: `vitest-recs-ni-${base}@example.com`, password: seedPassword });
    const movie = (await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1 } })).movie;
    const show = (await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 2 } })).show;
    await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: base + 10, name: 'Hidden Movie' });
    await seedMovieRecommendation({ sourceMovieId: movie.id, moviedb_id: base + 11, name: 'Visible Movie' });
    await seedTvShowRecommendation({ sourceTvShowId: show.id, moviedb_id: base + 10, name: 'Same Id Show' });
    await seedNotInterested({ watcherId: userId, type: 'movie', moviedb_id: base + 10 });
    await seedNotInterested({ watcherId: other.id, type: 'movie', moviedb_id: base + 11 });

    const { data, total } = await listRecommendations(opts(userId));

    // Hiding a movie id does not hide a show that happens to share the TMDB id.
    expect(data.map((r) => r.name).sort()).toEqual(['Same Id Show', 'Visible Movie']);
    expect(total).toBe(2);
  });

  it('paginates stably with a total independent of the page', async () => {
    const { base, userId } = await setup();
    const source = (await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1 } })).movie;
    for (let i = 0; i < 5; i++) {
      await seedMovieRecommendation({ sourceMovieId: source.id, moviedb_id: base + 10 + i, name: `Same Score ${i}` });
    }

    const first = await listRecommendations(opts(userId, { limit: 2, offset: 0 }));
    const second = await listRecommendations(opts(userId, { limit: 2, offset: 2 }));
    const third = await listRecommendations(opts(userId, { limit: 2, offset: 4 }));
    const beyond = await listRecommendations(opts(userId, { limit: 2, offset: 10 }));

    expect([...first.data, ...second.data, ...third.data].map((r) => r.name)).toEqual([
      'Same Score 0',
      'Same Score 1',
      'Same Score 2',
      'Same Score 3',
      'Same Score 4',
    ]);
    expect([first.total, second.total, third.total, beyond.total]).toEqual([5, 5, 5, 5]);
    expect(beyond.data).toEqual([]);
  });
});

describe('markNotInterested / unmarkNotInterested', () => {
  it('hides a candidate, is repeatable, and can be undone', async () => {
    const { base, userId } = await setup();
    const source = (await seedSubscribedMovie({ watcherId: userId, movie: { moviedb_id: base + 1 } })).movie;
    await seedMovieRecommendation({ sourceMovieId: source.id, moviedb_id: base + 10 });

    await markNotInterested(userId, 'movie', base + 10);
    await markNotInterested(userId, 'movie', base + 10);
    expect((await listRecommendations(opts(userId))).data).toEqual([]);

    await unmarkNotInterested(userId, 'movie', base + 10);
    await unmarkNotInterested(userId, 'movie', base + 10);
    expect((await listRecommendations(opts(userId))).data).toHaveLength(1);
  });

  it('hides shows independently of movies', async () => {
    const { base, userId } = await setup();
    const source = (await seedSubscribedTvShow({ watcherId: userId, show: { moviedb_id: base + 1 } })).show;
    await seedTvShowRecommendation({ sourceTvShowId: source.id, moviedb_id: base + 10 });

    await markNotInterested(userId, 'movie', base + 10);
    expect((await listRecommendations(opts(userId))).data).toHaveLength(1);
    await markNotInterested(userId, 'tvshow', base + 10);
    expect((await listRecommendations(opts(userId))).data).toEqual([]);
  });
});
