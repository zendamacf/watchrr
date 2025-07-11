import { db } from '@/lib/db';
import { episodes, tvshows } from '@/lib/db/schema';
import { getAllEpisodes, getTvShow, TMDBEpisode, TMDBTvShow } from '@/lib/themoviedb/tvshows';
import { Episode, Show } from '@/types';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { ResourceNotFound } from './errors';

/**
 * Refresh all metadata for a TV Show & its episodes, and imports in any new episodes.
 *
 * @throws {ResourceNotFound} if the TV Show cannot be found.
 */
export const refreshTvShow = async (tvshow_id: number) => {
  const [dbShow] = await db.select().from(tvshows).where(eq(tvshows.id, tvshow_id));
  if (!dbShow) throw new ResourceNotFound();

  console.log(`[SHOW][${dbShow.name}] Refreshing`);
  const apiShow = await getTvShow(dbShow.moviedb_id);
  const showLookup: { dbKey: keyof Show; apiKey: keyof TMDBTvShow }[] = [
    { dbKey: 'name', apiKey: 'name' },
    { dbKey: 'description', apiKey: 'description' },
    { dbKey: 'country', apiKey: 'country' },
    { dbKey: 'poster_slug', apiKey: 'poster' },
    { dbKey: 'backdrop_slug', apiKey: 'backdrop' },
  ];
  const diffs = showLookup.filter(({ dbKey, apiKey }) => dbShow[dbKey] !== apiShow[apiKey]);
  if (diffs.length) {
    console.log(`[SHOW][${dbShow.name}] Updating metadata`);
    await db
      .update(tvshows)
      .set({
        name: apiShow.name,
        description: apiShow.description,
        country: apiShow.country,
        poster_slug: apiShow.poster,
        backdrop_slug: apiShow.backdrop,
      })
      .where(eq(tvshows.id, tvshow_id));
  }

  console.log(`[SHOW][${dbShow.name}] Refreshing episodes`);
  const dbEpisodes = await db.select().from(episodes).where(eq(episodes.tvshow_id, dbShow.id));
  const apiEpisodes = await getAllEpisodes(dbShow.moviedb_id);
  console.log(
    `[SHOW][${dbShow.name}] ${dbEpisodes.length}/${apiEpisodes.length} episodes existing`,
  );
  const episodeLookup: { dbKey: keyof Episode; apiKey: keyof TMDBEpisode }[] = [
    { dbKey: 'name', apiKey: 'name' },
    { dbKey: 'description', apiKey: 'description' },
    { dbKey: 'backdrop_slug', apiKey: 'backdrop' },
  ];
  let inserted = 0;
  let updated = 0;
  let ignored = 0;
  for (const apiEpisode of apiEpisodes) {
    const dbEpisode = dbEpisodes.find((e) => e.moviedb_id === apiEpisode.id);
    if (dbEpisode) {
      const diffs = episodeLookup.filter(
        ({ dbKey, apiKey }) => dbEpisode[dbKey] !== apiEpisode[apiKey],
      );
      if (diffs.length) {
        await db
          .update(episodes)
          .set({
            season: apiEpisode.seasonNumber,
            episode: apiEpisode.episodeNumber,
            name: apiEpisode.name,
            airdate: DateTime.fromISO(apiEpisode.airdate).toFormat('kkkk-LL-dd'),
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
        airdate: DateTime.fromISO(apiEpisode.airdate).toFormat('kkkk-LL-dd'),
        moviedb_id: apiEpisode.id,
        backdrop_slug: apiEpisode.backdrop,
        description: apiEpisode.description,
      });
      inserted++;
    }
  }
  console.log(`[SHOW][${dbShow.name}] Added ${inserted}, updated ${updated}, ignored ${ignored}`);
};
