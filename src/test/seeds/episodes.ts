import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { episodes } from '@/lib/db/schema';
import { testEpisode } from '@/test/fixtures/episode';
import type { Episode } from '@/types';

export async function seedEpisode(options: {
  tvshowId: number;
  overrides?: Partial<typeof testEpisode>;
}): Promise<Episode> {
  const values = { ...testEpisode, tvshow_id: options.tvshowId, ...options.overrides };

  const [existing] = await db.select().from(episodes).where(eq(episodes.moviedb_id, values.moviedb_id)).limit(1);
  if (existing) return existing;

  const [inserted] = await db
    .insert(episodes)
    .values({
      tvshow_id: values.tvshow_id,
      season: values.season,
      episode: values.episode,
      name: values.name,
      airdate: values.airdate,
      moviedb_id: values.moviedb_id,
      backdrop_slug: values.backdrop_slug,
      description: values.description,
    })
    .returning();

  if (!inserted) {
    throw new Error(`Failed to seed episode ${values.moviedb_id}`);
  }

  return inserted;
}
