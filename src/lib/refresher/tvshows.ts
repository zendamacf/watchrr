import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '@/lib/db';
import { episodes, tvshows } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { getAllEpisodes, getTvShow, type TMDBEpisode, type TMDBTvShow } from '@/lib/themoviedb/tvshows';
import type { Episode, Show } from '@/types';
import { ResourceNotFound } from './errors';
import { type DiffLookup, dateCompare, getDiff } from './utils';

/**
 * Refresh all metadata for a TV Show & its episodes, and imports in any new episodes.
 *
 * @throws {ResourceNotFound} if the TV Show cannot be found.
 */
export const refreshTvShow = async (tvshowId: string) => {
  const started = Date.now();
  const [dbShow] = await db.select().from(tvshows).where(eq(tvshows.id, tvshowId));
  if (!dbShow) throw new ResourceNotFound();

  logger.info('show refresh started', {
    operation: 'refreshTvShow',
    showId: tvshowId,
    showName: dbShow.name,
  });

  try {
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
      logger.info('show metadata updated', {
        operation: 'refreshTvShow',
        showId: tvshowId,
        showName: dbShow.name,
        changedFields: diffs.map((d) => d.dbKey).join(','),
      });
      await db
        .update(tvshows)
        .set({
          name: apiShow.name,
          description: apiShow.description,
          country: apiShow.country,
          poster_slug: apiShow.poster,
          backdrop_slug: apiShow.backdrop,
        })
        .where(eq(tvshows.id, tvshowId));
    }

    const dbEpisodes = await db.select().from(episodes).where(eq(episodes.tvshow_id, dbShow.id));
    const apiEpisodes = await getAllEpisodes(dbShow.moviedb_id);
    if (apiEpisodes.length > dbEpisodes.length) {
      logger.info('show episodes behind tmdb', {
        operation: 'refreshTvShow',
        showId: tvshowId,
        showName: dbShow.name,
        localEpisodeCount: dbEpisodes.length,
        remoteEpisodeCount: apiEpisodes.length,
      });
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
        const episodeDiffs = getDiff(dbEpisode, apiEpisode, episodeLookup);
        if (episodeDiffs.length) {
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
            .where(eq(episodes.id, dbEpisode.id));
          updated++;
        } else {
          ignored++;
        }
      } else {
        await db.insert(episodes).values({
          tvshow_id: dbShow.id,
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
      logger.info('show episodes synced', {
        operation: 'refreshTvShow',
        showId: tvshowId,
        showName: dbShow.name,
        episodesInserted: inserted,
        episodesUpdated: updated,
        episodesUnchanged: ignored,
      });
    }

    await db
      .update(tvshows)
      .set({ metadata_refreshed_at: new Date() })
      .where(eq(tvshows.id, tvshowId));

    logger.info('show refresh completed', {
      operation: 'refreshTvShow',
      showId: tvshowId,
      durationMs: Date.now() - started,
      metadataChanged: diffs.length > 0,
      episodesInserted: inserted,
      episodesUpdated: updated,
    });
  } catch (error) {
    logger.error('show refresh failed', error, {
      operation: 'refreshTvShow',
      showId: tvshowId,
      durationMs: Date.now() - started,
    });
    throw error;
  }
};
