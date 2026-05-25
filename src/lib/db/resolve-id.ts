import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { episodes, movies, tvshows } from '@/lib/db/schema';

export type ResolvedEntityId = { id: number; uuid: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(param: string): boolean {
  return UUID_PATTERN.test(param);
}

export function parseLegacyId(param: string): number | undefined {
  if (!/^\d+$/.test(param)) return undefined;
  const id = Number.parseInt(param, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export function isMediaIdParam(param: string): boolean {
  return isUuid(param) || parseLegacyId(param) !== undefined;
}

export async function resolveTvshowId(param: string): Promise<ResolvedEntityId | undefined> {
  if (isUuid(param)) {
    const [row] = await db
      .select({ id: tvshows.id, uuid: tvshows.uuid })
      .from(tvshows)
      .where(eq(tvshows.uuid, param))
      .limit(1);
    return row;
  }
  const legacyId = parseLegacyId(param);
  if (legacyId === undefined) return undefined;
  const [row] = await db
    .select({ id: tvshows.id, uuid: tvshows.uuid })
    .from(tvshows)
    .where(eq(tvshows.id, legacyId))
    .limit(1);
  return row;
}

export async function resolveMovieId(param: string): Promise<ResolvedEntityId | undefined> {
  if (isUuid(param)) {
    const [row] = await db
      .select({ id: movies.id, uuid: movies.uuid })
      .from(movies)
      .where(eq(movies.uuid, param))
      .limit(1);
    return row;
  }
  const legacyId = parseLegacyId(param);
  if (legacyId === undefined) return undefined;
  const [row] = await db
    .select({ id: movies.id, uuid: movies.uuid })
    .from(movies)
    .where(eq(movies.id, legacyId))
    .limit(1);
  return row;
}

export async function resolveEpisodeId(param: string): Promise<ResolvedEntityId | undefined> {
  if (isUuid(param)) {
    const [row] = await db
      .select({ id: episodes.id, uuid: episodes.uuid })
      .from(episodes)
      .where(eq(episodes.uuid, param))
      .limit(1);
    return row;
  }
  const legacyId = parseLegacyId(param);
  if (legacyId === undefined) return undefined;
  const [row] = await db
    .select({ id: episodes.id, uuid: episodes.uuid })
    .from(episodes)
    .where(eq(episodes.id, legacyId))
    .limit(1);
  return row;
}
