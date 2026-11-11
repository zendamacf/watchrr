export type WatchCounts = {
  total: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  /** Watched before watch times were recorded; counted in total only. */
  unknownDate: number;
};

export type ActivityPoint = {
  /** ISO date (yyyy-MM-dd) of the Monday starting the week. */
  weekStart: string;
  episodes: number;
  movies: number;
};

export type WeekdayPoint = {
  /** 1 = Monday ... 7 = Sunday. */
  weekday: number;
  count: number;
};

export type ShowStatusCounts = {
  watching: number;
  caughtUp: number;
  snoozed: number;
  ended: number;
};

export type OverallStats = {
  range: { from: string; to: string };
  timezone: string;
  episodes: WatchCounts;
  movies: WatchCounts;
  /** Estimated minutes watched, from runtimes stored by TMDB refresh. */
  watchMinutes: number;
  /** Watched items with no runtime yet; excluded from watchMinutes. */
  missingRuntimeCount: number;
  activity: ActivityPoint[];
  weekdays: WeekdayPoint[];
  shows: ShowStatusCounts;
  /** Aired, unwatched episodes across subscribed shows. */
  backlog: number;
  streaks: { current: number; longest: number };
};

export type SeasonProgress = {
  season: number;
  watched: number;
  aired: number;
  total: number;
};

export type ShowStats = {
  seasons: SeasonProgress[];
  watched: number;
  aired: number;
  backlog: number;
  /** Estimated minutes to watch the backlog; null when no runtimes are known. */
  backlogMinutes: number | null;
  startedAt: string | null;
  lastWatchedAt: string | null;
  episodesPerWeek: number | null;
  /** ISO date of the next episode not yet aired. */
  nextAirDate: string | null;
};
