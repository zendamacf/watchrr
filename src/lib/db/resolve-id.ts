import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { episodes, movies, tvshows } from '@/lib/db/schema';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(param: string): boolean {
  return UUID_PATTERN.test(param);
}

export async function resolveTvshowId(param: string): Promise<string | undefined> {
  if (!isUuid(param)) return undefined;
  const [row] = await db.select({ id: tvshows.id }).from(tvshows).where(eq(tvshows.id, param)).limit(1);
  return row?.id;
}

export async function resolveMovieId(param: string): Promise<string | undefined> {
  if (!isUuid(param)) return undefined;
  const [row] = await db.select({ id: movies.id }).from(movies).where(eq(movies.id, param)).limit(1);
  return row?.id;
}

export async function resolveEpisodeId(param: string): Promise<string | undefined> {
  if (!isUuid(param)) return undefined;
  const [row] = await db.select({ id: episodes.id }).from(episodes).where(eq(episodes.id, param)).limit(1);
  return row?.id;
}
