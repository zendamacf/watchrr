import { DateTime } from 'luxon';
import type { EpisodePublic, ShowPublic } from '@/types';

export type ParsedEpisode = {
  episodes: EpisodePublic & { local_date: DateTime; in_past: boolean };
  tvshows: ShowPublic;
};
