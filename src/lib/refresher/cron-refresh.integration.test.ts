import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { movies, tvshows } from '@/lib/db/schema';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { seedEpisode, seedSubscribedMovie, seedSubscribedTvShow, seedUser } from '@/test/seeds';
import { listCronMoviesToRefresh, listCronShowsToRefresh } from './cron-refresh';

describe('listCronMoviesToRefresh integration', () => {
  afterEach(() => {
    delete process.env.CRON_REFRESH_MODE;
    delete process.env.CRON_MOVIE_STALE_HOURS;
  });

  it('omits recently refreshed unwatched movies in incremental mode', async () => {
    process.env.CRON_REFRESH_MODE = 'incremental';
    process.env.CRON_MOVIE_STALE_HOURS = '48';

    const user = await seedUser({ email: `vitest-cron-inc-${Date.now()}@example.com`, password: seedPassword });
    const { movie } = await seedSubscribedMovie({
      watcherId: user.id,
      movie: { moviedb_id: 996_001 + Math.floor(Math.random() * 1000), name: 'Fresh Cron Movie' },
      watched: false,
    });

    await db.update(movies).set({ metadata_refreshed_at: new Date() }).where(eq(movies.id, movie.id));

    const rows = await listCronMoviesToRefresh('incremental');
    expect(rows.some((row) => row.movie_id === movie.id)).toBe(false);
  });

  it('includes all unwatched movies in full mode', async () => {
    process.env.CRON_REFRESH_MODE = 'full';
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    const { movie } = await seedSubscribedMovie({
      watcherId: user.id,
      movie: { moviedb_id: 996_501, name: 'Full Mode Movie' },
      watched: false,
    });

    await db.update(movies).set({ metadata_refreshed_at: new Date() }).where(eq(movies.id, movie.id));

    const rows = await listCronMoviesToRefresh('full');
    expect(rows.some((row) => row.movie_id === movie.id)).toBe(true);
  });
});

describe('listCronShowsToRefresh integration', () => {
  afterEach(() => {
    delete process.env.CRON_REFRESH_MODE;
    delete process.env.CRON_SHOW_STALE_HOURS;
  });

  it('omits recently refreshed shows in incremental mode without imminent episodes', async () => {
    process.env.CRON_REFRESH_MODE = 'incremental';
    const user = await seedUser({ email: `vitest-cron-show-${Date.now()}@example.com`, password: seedPassword });
    const { show } = await seedSubscribedTvShow({
      watcherId: user.id,
      show: { moviedb_id: 995_001 + Math.floor(Math.random() * 1000), name: 'Fresh Cron Show' },
    });
    await db.update(tvshows).set({ metadata_refreshed_at: new Date() }).where(eq(tvshows.id, show.id));

    const rows = await listCronShowsToRefresh('incremental');
    expect(rows.some((row) => row.tvshow_id === show.id)).toBe(false);
  });

  it('includes shows with imminent episode air dates even when metadata is fresh', async () => {
    process.env.CRON_REFRESH_MODE = 'incremental';
    const user = await seedUser({ email: `vitest-cron-imminent-${Date.now()}@example.com`, password: seedPassword });
    const { show } = await seedSubscribedTvShow({
      watcherId: user.id,
      show: { moviedb_id: 995_101 + Math.floor(Math.random() * 1000), name: 'Imminent Show' },
    });
    await db.update(tvshows).set({ metadata_refreshed_at: new Date() }).where(eq(tvshows.id, show.id));
    const airdate = DateTime.utc().plus({ days: 2 }).toISODate();
    if (!airdate) throw new Error('airdate missing');
    await seedEpisode({
      tvshowId: show.id,
      overrides: {
        moviedb_id: 995_102 + Math.floor(Math.random() * 1000),
        name: 'Soon',
        airdate,
      },
    });

    const rows = await listCronShowsToRefresh('incremental');
    expect(rows.some((row) => row.tvshow_id === show.id)).toBe(true);
  });

  it('includes all subscribed shows in full mode', async () => {
    process.env.CRON_REFRESH_MODE = 'full';
    const user = await seedUser({ email: seedEmails.apiUser, password: seedPassword });
    const { show } = await seedSubscribedTvShow({
      watcherId: user.id,
      show: { moviedb_id: 995_201, name: 'Full Mode Show' },
    });
    await db.update(tvshows).set({ metadata_refreshed_at: new Date() }).where(eq(tvshows.id, show.id));

    const rows = await listCronShowsToRefresh('full');
    expect(rows.some((row) => row.tvshow_id === show.id)).toBe(true);
  });
});
