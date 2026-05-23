import { vi } from 'vitest';

export const mockGetMovie = vi.fn();
export const mockSearchMovies = vi.fn();
export const mockGetTvShow = vi.fn();
export const mockSearchTvShows = vi.fn();
export const mockGetAllEpisodes = vi.fn();

vi.mock('@/lib/themoviedb/movies', () => ({
  getMovie: (...args: unknown[]) => mockGetMovie(...args),
  search: (...args: unknown[]) => mockSearchMovies(...args),
}));

vi.mock('@/lib/themoviedb/tvshows', () => ({
  getTvShow: (...args: unknown[]) => mockGetTvShow(...args),
  search: (...args: unknown[]) => mockSearchTvShows(...args),
  getAllEpisodes: (...args: unknown[]) => mockGetAllEpisodes(...args),
}));

export function resetThemoviedbMocks() {
  mockGetMovie.mockReset();
  mockSearchMovies.mockReset();
  mockGetTvShow.mockReset();
  mockSearchTvShows.mockReset();
  mockGetAllEpisodes.mockReset();
}
