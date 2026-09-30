/**
 * TV episode label, e.g. S01E05.
 */
export function formatEpisodeNumber(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
}
