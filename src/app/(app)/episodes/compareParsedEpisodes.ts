import { DateFormat } from '@/utils/dates';
import type { ParsedEpisode } from './types';

export function compareParsedEpisodes(a: ParsedEpisode, b: ParsedEpisode): number {
  const aDate = a.episodes.local_date.toFormat(DateFormat.YMD);
  const bDate = b.episodes.local_date.toFormat(DateFormat.YMD);
  if (aDate !== bDate) return aDate.localeCompare(bDate);

  const showCompare = a.tvshows.name.localeCompare(b.tvshows.name);
  if (showCompare !== 0) return showCompare;

  if (a.episodes.season !== b.episodes.season) return a.episodes.season - b.episodes.season;

  return a.episodes.episode - b.episodes.episode;
}
