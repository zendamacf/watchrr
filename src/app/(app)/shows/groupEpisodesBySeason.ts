import type { ShowEpisode } from '@/types';

export function groupEpisodesBySeason(episodes: ShowEpisode[]): [season: number, episodes: ShowEpisode[]][] {
  const bySeason = new Map<number, ShowEpisode[]>();
  for (const episode of episodes) {
    const list = bySeason.get(episode.season) ?? [];
    list.push(episode);
    bySeason.set(episode.season, list);
  }
  return [...bySeason.entries()]
    .sort(([a], [b]) => a - b)
    .map(([season, seasonEpisodes]) => [season, seasonEpisodes.sort((a, b) => a.episode - b.episode)] as const);
}
