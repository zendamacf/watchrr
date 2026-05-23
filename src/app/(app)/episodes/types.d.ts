import { DateTime } from 'luxon';
import { Episode, Show } from '@/types';

export type ParsedEpisode = {
  episodes: Episode & { local_date: DateTime; in_past: boolean };
  tvshows: Show;
};
