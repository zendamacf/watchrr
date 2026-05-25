import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { episodes, movies, tvshows } from '@/lib/db/schema';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(param: string): boolean {
  return UUID_PATTERN.test(param);
}

export async function resolveTvshowUuid(param: string): Promise<string | undefined> {
  if (!isUuid(param)) return undefined;
  const [row] = await db.select({ uuid: tvshows.uuid }).from(tvshows).where(eq(tvshows.uuid, param)).limit(1);
  return row?.uuid;
}

export async function resolveMovieUuid(param: string): Promise<string | undefined> {
  if (!isUuid(param)) return undefined;
  const [row] = await db.select({ uuid: movies.uuid }).from(movies).where(eq(movies.uuid, param)).limit(1);
  return row?.uuid;
}

export async function resolveEpisodeUuid(param: string): Promise<string | undefined> {
  if (!isUuid(param)) return undefined;
  const [row] = await db.select({ uuid: episodes.uuid }).from(episodes).where(eq(episodes.uuid, param)).limit(1);
  return row?.uuid;
}
