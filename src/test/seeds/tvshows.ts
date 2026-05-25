import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscribed_tvshows, tvshows } from '@/lib/db/schema';
import { testShow } from '@/test/fixtures/tvshow';
import type { Show } from '@/types';

export async function seedTvShow(overrides: Partial<typeof testShow> = {}): Promise<Show> {
  const values = { ...testShow, ...overrides };

  const [existing] = await db.select().from(tvshows).where(eq(tvshows.moviedb_id, values.moviedb_id)).limit(1);
  if (existing) return existing;

  const [inserted] = await db
    .insert(tvshows)
    .values({
      name: values.name,
      moviedb_id: values.moviedb_id,
      country: values.country,
      poster_slug: values.poster_slug,
      backdrop_slug: values.backdrop_slug,
      description: values.description,
    })
    .returning();

  if (!inserted) {
    throw new Error(`Failed to seed tv show ${values.moviedb_id}`);
  }

  return inserted;
}

export async function seedSubscribedTvShow(options: {
  watcherId: string;
  show?: Partial<typeof testShow>;
}): Promise<{ show: Show; tvshowId: string }> {
  const show = await seedTvShow(options.show ?? {});
  await db
    .insert(subscribed_tvshows)
    .values({
      watcher_id: options.watcherId,
      tvshow_id: show.id,
    })
    .onConflictDoNothing();

  return { show, tvshowId: show.id };
}
