import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { episodes } from '@/lib/db/schema';
import { testEpisode } from '@/test/fixtures/episode';
import type { Episode } from '@/types';

export async function seedEpisode(options: {
  tvshowUuid: string;
  overrides?: Partial<typeof testEpisode>;
}): Promise<Episode> {
  const values = { ...testEpisode, tvshow_uuid: options.tvshowUuid, ...options.overrides };

  const [existing] = await db.select().from(episodes).where(eq(episodes.moviedb_id, values.moviedb_id)).limit(1);
  if (existing) return existing;

  const [inserted] = await db
    .insert(episodes)
    .values({
      tvshow_uuid: values.tvshow_uuid,
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
