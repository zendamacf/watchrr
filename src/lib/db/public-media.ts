import type { Episode, Movie, Show } from '@/types';

export type ShowPublic = Omit<Show, 'id'>;
export type MoviePublic = Omit<Movie, 'id'>;
export type EpisodePublic = Omit<Episode, 'id'>;

export function toPublicShow(show: Show): ShowPublic {
  const { id: _id, ...publicShow } = show;
  return publicShow;
}

export function toPublicMovie(movie: Movie): MoviePublic {
  const { id: _id, ...publicMovie } = movie;
  return publicMovie;
}

export function toPublicEpisode(episode: Episode): EpisodePublic {
  const { id: _id, ...publicEpisode } = episode;
  return publicEpisode;
}
