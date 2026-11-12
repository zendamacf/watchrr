import { vi } from 'vitest';

export const mockRefreshMovie = vi.fn();
export const mockRefreshTvShow = vi.fn();
export const mockRefreshMovieRecommendations = vi.fn();
export const mockRefreshTvShowRecommendations = vi.fn();
export const mockListMoviesNeedingRecommendations = vi.fn();
export const mockListShowsNeedingRecommendations = vi.fn();

vi.mock('@/lib/refresher/movies', () => ({
  refreshMovie: (...args: unknown[]) => mockRefreshMovie(...args),
}));

vi.mock('@/lib/refresher/tvshows', () => ({
  refreshTvShow: (...args: unknown[]) => mockRefreshTvShow(...args),
}));

vi.mock('@/lib/refresher/recommendations', () => ({
  refreshMovieRecommendations: (...args: unknown[]) => mockRefreshMovieRecommendations(...args),
  refreshTvShowRecommendations: (...args: unknown[]) => mockRefreshTvShowRecommendations(...args),
  listMoviesNeedingRecommendations: (...args: unknown[]) => mockListMoviesNeedingRecommendations(...args),
  listShowsNeedingRecommendations: (...args: unknown[]) => mockListShowsNeedingRecommendations(...args),
}));

export function resetRefresherMocks() {
  mockRefreshMovie.mockReset().mockResolvedValue(undefined);
  mockRefreshTvShow.mockReset().mockResolvedValue(undefined);
  mockRefreshMovieRecommendations.mockReset().mockResolvedValue(undefined);
  mockRefreshTvShowRecommendations.mockReset().mockResolvedValue(undefined);
  mockListMoviesNeedingRecommendations.mockReset().mockResolvedValue([]);
  mockListShowsNeedingRecommendations.mockReset().mockResolvedValue([]);
}
