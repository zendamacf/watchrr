import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/lib/db';
import { episodes, tvshows } from '@/lib/db/schema';
import { getAllEpisodes, getTvShow, type TMDBEpisode, type TMDBTvShow } from '@/lib/themoviedb/tvshows';
import type { Episode, Show } from '@/types';
import { ResourceNotFound } from './errors';
import { type DiffLookup, dateCompare, getDiff } from './utils';

/**
 * Refresh all metadata for a TV Show & its episodes, and imports in any new episodes.
 *
 * @throws {ResourceNotFound} if the TV Show cannot be found.
 */
export const refreshTvShow = async (tvshowUuid: string) => {
  const [dbShow] = await db.select().from(tvshows).where(eq(tvshows.uuid, tvshowUuid));
  if (!dbShow) throw new ResourceNotFound();

  console.log(`[SHOW][${dbShow.name}] Refreshing`);
  const apiShow = await getTvShow(dbShow.moviedb_id);
  const showLookup: DiffLookup<Show, TMDBTvShow>[] = [
    { dbKey: 'name', apiKey: 'name' },
    { dbKey: 'description', apiKey: 'description' },
    { dbKey: 'country', apiKey: 'country' },
    { dbKey: 'poster_slug', apiKey: 'poster' },
    { dbKey: 'backdrop_slug', apiKey: 'backdrop' },
  ];
  const diffs = getDiff(dbShow, apiShow, showLookup);
  if (diffs.length) {
    console.info(`[SHOW][${dbShow.name}] Updating metadata, changes in ${diffs.map((d) => d.dbKey)}`);
    await db
      .update(tvshows)
      .set({
        name: apiShow.name,
        description: apiShow.description,
        country: apiShow.country,
        poster_slug: apiShow.poster,
        backdrop_slug: apiShow.backdrop,
      })
      .where(eq(tvshows.uuid, tvshowUuid));
  }

  console.log(`[SHOW][${dbShow.name}] Refreshing episodes`);
  const dbEpisodes = await db.select().from(episodes).where(eq(episodes.tvshow_uuid, dbShow.uuid));
  const apiEpisodes = await getAllEpisodes(dbShow.moviedb_id);
  if (apiEpisodes.length > dbEpisodes.length) {
    console.info(`[SHOW][${dbShow.name}] ${dbEpisodes.length}/${apiEpisodes.length} episodes existing`);
  }
  const episodeLookup: DiffLookup<Episode, TMDBEpisode>[] = [
    { dbKey: 'season', apiKey: 'seasonNumber' },
    { dbKey: 'episode', apiKey: 'episodeNumber' },
    { dbKey: 'name', apiKey: 'name' },
    { dbKey: 'description', apiKey: 'description' },
    { dbKey: 'backdrop_slug', apiKey: 'backdrop' },
    { dbKey: 'airdate', apiKey: 'airdate', compare: dateCompare },
  ];
  let inserted = 0;
  let updated = 0;
  let ignored = 0;
  for (const apiEpisode of apiEpisodes) {
    const dbEpisode = dbEpisodes.find((e) => e.moviedb_id === apiEpisode.id);
    if (dbEpisode) {
      const diffs = getDiff(dbEpisode, apiEpisode, episodeLookup);
      if (diffs.length) {
        await db
          .update(episodes)
          .set({
            season: apiEpisode.seasonNumber,
            episode: apiEpisode.episodeNumber,
            name: apiEpisode.name,
            airdate: DateTime.fromISO(apiEpisode.airdate).toSQLDate()!,
            moviedb_id: apiEpisode.id,
            backdrop_slug: apiEpisode.backdrop,
            description: apiEpisode.description,
          })
          .where(eq(episodes.uuid, dbEpisode.uuid));
        updated++;
      } else {
        ignored++;
      }
    } else {
      await db.insert(episodes).values({
        tvshow_uuid: dbShow.uuid,
        season: apiEpisode.seasonNumber,
        episode: apiEpisode.episodeNumber,
        name: apiEpisode.name,
        airdate: DateTime.fromISO(apiEpisode.airdate).toSQLDate()!,
        moviedb_id: apiEpisode.id,
        backdrop_slug: apiEpisode.backdrop,
        description: apiEpisode.description,
      });
      inserted++;
    }
  }
  if (inserted + updated > 0) {
    console.info(`[SHOW][${dbShow.name}] Added ${inserted}, updated ${updated}, ignored ${ignored}`);
  }
  console.log(`[SHOW][${dbShow.name}] Finished refreshing`);
};
