import { vi } from 'vitest';

export const mockRefreshMovie = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
export const mockRefreshTvShow = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

vi.mock('@/lib/refresher/movies', () => ({
  refreshMovie: (...args: unknown[]) => mockRefreshMovie(...args),
}));

vi.mock('@/lib/refresher/tvshows', () => ({
  refreshTvShow: (...args: unknown[]) => mockRefreshTvShow(...args),
}));

export function resetRefresherMocks() {
  mockRefreshMovie.mockReset().mockResolvedValue(undefined);
  mockRefreshTvShow.mockReset().mockResolvedValue(undefined);
}
