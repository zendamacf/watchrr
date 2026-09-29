import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { movies } from '@/lib/db/schema';
import { seedEmails, seedPassword } from '@/test/fixtures/user';
import { seedSubscribedMovie, seedUser } from '@/test/seeds';
import { listCronMoviesToRefresh } from './cron-refresh';

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
