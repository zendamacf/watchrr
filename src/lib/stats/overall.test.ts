import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import {
  genres,
  movie_genres,
  subscribed_movies,
  subscribed_tvshows,
  tvshow_genres,
  watched_episodes,
} from '@/lib/db/schema';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { seedEpisode, seedMovie, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { computeStreaks, getOverallStats, isValidTimezone } from './overall';

// Wednesday; its week starts Monday 2026-11-09.
const now = DateTime.fromISO('2026-11-11T12:00:00Z', { zone: 'utc' });

describe('computeStreaks', () => {
  it('returns zero for no history', () => {
    expect(computeStreaks([], '2026-11-11')).toEqual({ current: 0, longest: 0 });
  });

  it('keeps the current streak alive through yesterday', () => {
    expect(computeStreaks(['2026-11-08', '2026-11-09', '2026-11-10'], '2026-11-11')).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it('breaks the current streak after a missed day but keeps the longest', () => {
    const dates = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-09', '2026-11-09'];
    expect(computeStreaks(dates, '2026-11-11')).toEqual({ current: 0, longest: 3 });
  });

  it('counts a run ending today', () => {
    expect(computeStreaks(['2026-11-10', '2026-11-11'], '2026-11-11')).toEqual({ current: 2, longest: 2 });
  });
});

describe('isValidTimezone', () => {
  it('accepts IANA names and rejects junk', () => {
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('Not/AZone')).toBe(false);
  });
});

describe('getOverallStats', () => {
  let userId: string;
  let otherId: string;

  beforeAll(async () => {
    userId = (await seedUser({ email: seedEmails.statsOverall, password: seedPassword })).id;
    otherId = (await seedUser({ email: seedEmails.statsOther, password: seedPassword })).id;
  });

  beforeEach(async () => {
    for (const id of [userId, otherId]) {
      await db.delete(watched_episodes).where(eq(watched_episodes.watcher_id, id));
      await db.delete(subscribed_movies).where(eq(subscribed_movies.watcher_id, id));
      await db.delete(subscribed_tvshows).where(eq(subscribed_tvshows.watcher_id, id));
    }
  });

  it('returns zeros and an empty state for a user with no history', async () => {
    const stats = await getOverallStats({ userId, now });
    expect(stats.episodes).toEqual({ total: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, unknownDate: 0 });
    expect(stats.movies.total).toBe(0);
    expect(stats.watchMinutes).toBe(0);
    expect(stats.backlog).toBe(0);
    expect(stats.shows).toEqual({ watching: 0, caughtUp: 0, snoozed: 0, ended: 0 });
    expect(stats.streaks).toEqual({ current: 0, longest: 0 });
    expect(stats.weekdays).toHaveLength(7);
    expect(stats.activity.every((p) => p.episodes === 0 && p.movies === 0)).toBe(true);
  });

  it('aggregates episodes, movies, backlog and streaks, treating null watched_at as unknown date', async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 997_001, name: 'Stats Show', status: 'Returning Series' },
    });
    const eps = [];
    for (const n of [1, 2, 3]) {
      eps.push(
        await seedEpisode({
          tvshowId,
          overrides: { moviedb_id: 997_010 + n, episode: n, airdate: '2026-01-01', runtime: 30 },
        }),
      );
    }
    await db.insert(watched_episodes).values([
      { episode_id: eps[0]!.id, watcher_id: userId, watched_at: new Date('2026-11-10T10:00:00Z') },
      { episode_id: eps[1]!.id, watcher_id: userId, watched_at: new Date('2026-11-11T08:00:00Z') },
    ]);
    const dated = await seedMovie({ moviedb_id: 997_021, name: 'Dated', runtime: 100 });
    const undated = await seedMovie({ moviedb_id: 997_022, name: 'Undated', runtime: null });
    await db.insert(subscribed_movies).values([
      { movie_id: dated.id, watcher_id: userId, watched: true, watched_at: new Date('2026-10-01T20:00:00Z') },
      { movie_id: undated.id, watcher_id: userId, watched: true, watched_at: null },
    ]);

    const stats = await getOverallStats({ userId, now });

    expect(stats.episodes).toEqual({ total: 2, thisWeek: 2, thisMonth: 2, thisYear: 2, unknownDate: 0 });
    expect(stats.movies).toEqual({ total: 2, thisWeek: 0, thisMonth: 0, thisYear: 1, unknownDate: 1 });
    expect(stats.watchMinutes).toBe(160);
    expect(stats.missingRuntimeCount).toBe(1);
    expect(stats.backlog).toBe(1);
    expect(stats.shows).toEqual({ watching: 1, caughtUp: 0, snoozed: 0, ended: 0 });
    expect(stats.streaks).toEqual({ current: 2, longest: 2 });
    // Nov 10 is a Tuesday (2) and Nov 11 a Wednesday (3).
    expect(stats.weekdays.find((d) => d.weekday === 2)?.count).toBe(1);
    expect(stats.weekdays.find((d) => d.weekday === 3)?.count).toBe(1);
    const thisWeek = stats.activity.find((p) => p.weekStart === '2026-11-09');
    expect(thisWeek).toEqual({ weekStart: '2026-11-09', episodes: 2, movies: 0 });
    expect(stats.activity.find((p) => p.weekStart === '2026-09-28')?.movies).toBe(1);
  });

  it('breaks watched items down by genre, with an Unknown bucket for items without genres', async () => {
    await db
      .insert(genres)
      .values([
        { id: 990_021, name: 'Test Action' },
        { id: 990_022, name: 'Test Drama' },
      ])
      .onConflictDoNothing();
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: userId,
      show: { moviedb_id: 997_031, name: 'Genre Show' },
    });
    await db
      .insert(tvshow_genres)
      .values([
        { tvshow_id: tvshowId, genre_id: 990_021 },
        { tvshow_id: tvshowId, genre_id: 990_022 },
      ])
      .onConflictDoNothing();
    const eps = [];
    for (const n of [1, 2]) {
      eps.push(
        await seedEpisode({
          tvshowId,
          overrides: { moviedb_id: 997_040 + n, episode: n, airdate: '2026-01-01', runtime: 30 },
        }),
      );
    }
    await db.insert(watched_episodes).values(eps.map((e) => ({ episode_id: e.id, watcher_id: userId })));
    const action = await seedMovie({ moviedb_id: 997_051, name: 'Action Movie', runtime: 100 });
    const bare = await seedMovie({ moviedb_id: 997_052, name: 'Bare Movie', runtime: 90 });
    await db.insert(movie_genres).values({ movie_id: action.id, genre_id: 990_021 }).onConflictDoNothing();
    await db.insert(subscribed_movies).values([
      { movie_id: action.id, watcher_id: userId, watched: true },
      { movie_id: bare.id, watcher_id: userId, watched: true },
    ]);

    const stats = await getOverallStats({ userId, now });

    expect(stats.genres).toEqual([
      { id: 990_021, name: 'Test Action', episodes: 2, movies: 1, minutes: 160 },
      { id: 990_022, name: 'Test Drama', episodes: 2, movies: 0, minutes: 60 },
      { id: null, name: 'Unknown', episodes: 0, movies: 1, minutes: 90 },
    ]);
  });

  it('returns no genres for a user with no history', async () => {
    expect((await getOverallStats({ userId, now })).genres).toEqual([]);
  });

  it('honours the from/to range for charts but not for totals', async () => {
    const dated = await seedMovie({ moviedb_id: 997_021, name: 'Dated', runtime: 100 });
    await db.insert(subscribed_movies).values({
      movie_id: dated.id,
      watcher_id: userId,
      watched: true,
      watched_at: new Date('2026-10-01T20:00:00Z'),
    });

    const stats = await getOverallStats({ userId, now, from: '2026-11-01', to: '2026-11-11' });
    expect(stats.movies.total).toBe(1);
    expect(stats.activity.every((p) => p.movies === 0)).toBe(true);
    expect(stats.range).toEqual({ from: '2026-11-01', to: '2026-11-11' });
  });

  it('classifies caught up, snoozed and ended shows', async () => {
    const mk = async (id: number, show: { status: string }, airdate: string, snooze?: string) => {
      const { tvshowId } = await seedSubscribedTvShow({
        watcherId: userId,
        show: { moviedb_id: id, name: `Status ${id}`, status: show.status },
      });
      const ep = await seedEpisode({ tvshowId, overrides: { moviedb_id: id + 500, airdate } });
      if (snooze) {
        await db
          .update(subscribed_tvshows)
          .set({ snoozed_until: snooze })
          .where(eq(subscribed_tvshows.tvshow_id, tvshowId));
      }
      return ep;
    };
    const caught = await mk(997_101, { status: 'Returning Series' }, '2026-01-01');
    await db.insert(watched_episodes).values({ episode_id: caught.id, watcher_id: userId, watched_at: new Date() });
    await mk(997_102, { status: 'Returning Series' }, '2026-01-01', '2026-12-31');
    await mk(997_103, { status: 'Ended' }, '2026-01-01');
    await mk(997_104, { status: 'Returning Series' }, '2027-01-01');

    const stats = await getOverallStats({ userId, now });
    // Future-only episodes are not backlog, so the unaired show counts as caught up.
    expect(stats.shows).toEqual({ watching: 0, caughtUp: 2, snoozed: 1, ended: 1 });
  });

  it("never includes another user's history", async () => {
    const { tvshowId } = await seedSubscribedTvShow({
      watcherId: otherId,
      show: { moviedb_id: 997_201, name: 'Other Show' },
    });
    const ep = await seedEpisode({ tvshowId, overrides: { moviedb_id: 997_202, airdate: '2026-01-01' } });
    await db.insert(watched_episodes).values({ episode_id: ep.id, watcher_id: otherId, watched_at: new Date() });

    const stats = await getOverallStats({ userId, now });
    expect(stats.episodes.total).toBe(0);
    expect(stats.shows).toEqual({ watching: 0, caughtUp: 0, snoozed: 0, ended: 0 });
  });
});
