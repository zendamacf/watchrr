import { vi } from 'vitest';

export const mockGetMovie = vi.fn();
export const mockSearchMovies = vi.fn();
export const mockGetTvShow = vi.fn();
export const mockSearchTvShows = vi.fn();
export const mockGetAllEpisodes = vi.fn();
export const mockGetMovieRecommendations = vi.fn();
export const mockGetTvShowRecommendations = vi.fn();
export const mockGetMovieDetails = vi.fn();
export const mockGetTvShowDetails = vi.fn();

vi.mock('@/lib/themoviedb/movies', () => ({
  getMovie: (...args: unknown[]) => mockGetMovie(...args),
  getMovieDetails: (...args: unknown[]) => mockGetMovieDetails(...args),
  getMovieRecommendations: (...args: unknown[]) => mockGetMovieRecommendations(...args),
  search: (...args: unknown[]) => mockSearchMovies(...args),
}));

vi.mock('@/lib/themoviedb/tvshows', () => ({
  getTvShow: (...args: unknown[]) => mockGetTvShow(...args),
  getTvShowDetails: (...args: unknown[]) => mockGetTvShowDetails(...args),
  getTvShowRecommendations: (...args: unknown[]) => mockGetTvShowRecommendations(...args),
  search: (...args: unknown[]) => mockSearchTvShows(...args),
  getAllEpisodes: (...args: unknown[]) => mockGetAllEpisodes(...args),
}));

export function resetThemoviedbMocks() {
  mockGetMovie.mockReset();
  mockSearchMovies.mockReset();
  mockGetTvShow.mockReset();
  mockSearchTvShows.mockReset();
  mockGetAllEpisodes.mockReset();
  mockGetMovieDetails.mockReset();
  mockGetTvShowDetails.mockReset();
  mockGetMovieRecommendations.mockReset().mockResolvedValue([]);
  mockGetTvShowRecommendations.mockReset().mockResolvedValue([]);
}
