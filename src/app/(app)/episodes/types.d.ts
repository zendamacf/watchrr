import { DateTime } from 'luxon';
import type { Episode, Show, ShowSubscription } from '@/types';

export type ParsedEpisode = {
  episodes: Episode & {
    local_date: DateTime;
    original_local_date: DateTime;
    in_past: boolean;
    is_snoozed: boolean;
    delay_days: number;
    snoozed_until: string | null;
  };
  tvshows: Show;
  subscription: ShowSubscription;
};
