import { Episode, Show } from '@/types';
import { DateTime } from 'luxon';

type ParsedEpisode = {
  episodes: Episode & { local_date: DateTime; in_past: boolean };
  tvshows: Show;
};
