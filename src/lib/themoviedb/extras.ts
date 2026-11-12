/**
 * Shared mapping for the extras (cast, trailer, where to watch) that movie and show details can
 * return alongside the title itself, so one TMDB request covers everything the info modal needs.
 */

/** The keys passed to TMDB's `append_to_response`. */
export const DETAILS_APPEND = ['credits', 'videos', 'watch/providers'] as const;

/** How many cast members are kept; TMDB lists dozens, in billing order. */
export const CAST_LIMIT = 6;

export type TMDBCastMember = { name: string; character: string | null };
export type TMDBProvider = { name: string; logo: string | null };
/** Streaming providers in one region, with TMDB's page that lists every option. */
export type TMDBWatchRegion = { link: string | null; providers: TMDBProvider[] };

/** Details shared by movies and shows. Movie-only and show-only fields are null for the other. */
export type TMDBTitleDetails = {
  tagline: string | null;
  genres: string[];
  /** TMDB's 0-10 average. Null when nobody has voted. */
  rating: number | null;
  votes: number;
  runtime: number | null;
  seasons: number | null;
  status: string | null;
  cast: TMDBCastMember[];
  /** YouTube video key of the best trailer, if any. */
  trailer: string | null;
  /** Streaming providers by ISO 3166-1 region (e.g. `NZ`). Regions without any are left out. */
  watch: Record<string, TMDBWatchRegion>;
};

type Extras = {
  credits?: { cast?: { name: string; character?: string | null }[] };
  videos?: { results?: { key: string; site: string; type: string; official?: boolean }[] };
  /** TMDB types the results as an interface keyed by every region, which has no index signature. */
  'watch/providers'?: { results?: object };
};

type WatchEntry = { link?: string; flatrate?: { provider_name: string; logo_path?: string | null }[] };

const pickTrailer = (videos: NonNullable<Extras['videos']>['results']): string | null => {
  const trailers = (videos ?? []).filter((v) => v.site === 'YouTube' && v.type === 'Trailer');
  return (trailers.find((v) => v.official) ?? trailers[0])?.key ?? null;
};

const mapWatch = (results: object = {}): Record<string, TMDBWatchRegion> => {
  const watch: Record<string, TMDBWatchRegion> = {};
  for (const [region, entry] of Object.entries(results) as [string, WatchEntry | undefined][]) {
    const providers = (entry?.flatrate ?? []).map((p) => ({ name: p.provider_name, logo: p.logo_path ?? null }));
    if (providers.length) watch[region] = { link: entry?.link ?? null, providers };
  }
  return watch;
};

/** Maps the appended `credits`, `videos` and `watch/providers` of a details response. */
export const mapExtras = (d: Extras): Pick<TMDBTitleDetails, 'cast' | 'trailer' | 'watch'> => ({
  cast: (d.credits?.cast ?? [])
    .slice(0, CAST_LIMIT)
    .map((c) => ({ name: c.name, character: c.character?.trim() || null })),
  trailer: pickTrailer(d.videos?.results),
  watch: mapWatch(d['watch/providers']?.results),
});
