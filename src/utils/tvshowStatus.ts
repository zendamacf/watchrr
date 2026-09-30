import type { Show } from '@/types';

/** TMDB `status` values on TV show details. */
export const TMDB_TV_SHOW_STATUSES = [
  'Returning Series',
  'Planned',
  'In Production',
  'Ended',
  'Canceled',
  'Pilot',
] as const;

export type TmdbTvShowStatus = (typeof TMDB_TV_SHOW_STATUSES)[number];

export const TV_SHOW_STATUS_FILTER_ALL = 'all' as const;
export const TV_SHOW_STATUS_FILTER_UNKNOWN = 'unknown' as const;

export type TvShowStatusFilter =
  | typeof TV_SHOW_STATUS_FILTER_ALL
  | typeof TV_SHOW_STATUS_FILTER_UNKNOWN
  | TmdbTvShowStatus;

export const TV_SHOW_STATUS_FILTER_OPTIONS: { value: TvShowStatusFilter; label: string }[] = [
  { value: TV_SHOW_STATUS_FILTER_ALL, label: 'All' },
  { value: 'Returning Series', label: 'Returning series' },
  { value: 'In Production', label: 'In production' },
  { value: 'Planned', label: 'Planned' },
  { value: 'Ended', label: 'Ended' },
  { value: 'Canceled', label: 'Canceled' },
  { value: 'Pilot', label: 'Pilot' },
  { value: TV_SHOW_STATUS_FILTER_UNKNOWN, label: 'Unknown' },
];

export function isKnownTmdbTvShowStatus(value: string | null | undefined): value is TmdbTvShowStatus {
  return !!value && (TMDB_TV_SHOW_STATUSES as readonly string[]).includes(value);
}

export function formatTvShowStatusLabel(status: string): string {
  if (status === 'Returning Series') return 'Returning series';
  if (status === 'In Production') return 'In production';
  return status;
}

export function tvShowStatusBadgeColor(status: string): string {
  switch (status) {
    case 'Returning Series':
    case 'In Production':
    case 'Pilot':
      return 'green';
    case 'Planned':
      return 'blue';
    case 'Ended':
      return 'gray';
    case 'Canceled':
      return 'red';
    default:
      return 'gray';
  }
}

export function showMatchesStatusFilter(show: Pick<Show, 'status'>, filter: TvShowStatusFilter): boolean {
  if (filter === TV_SHOW_STATUS_FILTER_ALL) return true;
  if (filter === TV_SHOW_STATUS_FILTER_UNKNOWN) return !show.status;
  return show.status === filter;
}
