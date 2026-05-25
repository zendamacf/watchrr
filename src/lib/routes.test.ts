import { describe, expect, it } from 'vitest';
import { apiRoutes, routes } from './routes';

describe('routes', () => {
  it('exposes app page paths', () => {
    expect(routes.home).toBe('/');
    expect(routes.episodes).toBe('/episodes');
    expect(routes.movies).toBe('/movies');
    expect(routes.signin).toBe('/signin');
  });
});

describe('apiRoutes', () => {
  it('movieSearch builds query string from URLSearchParams', () => {
    const params = new URLSearchParams({ q: 'inception' });
    expect(apiRoutes.movieSearch(params)).toBe('/api/movie/search?q=inception');
  });

  it('movieSearch accepts a pre-built query string', () => {
    expect(apiRoutes.movieSearch('q=matrix&page=2')).toBe('/api/movie/search?q=matrix&page=2');
  });

  it('tvshowSearch builds query string from URLSearchParams', () => {
    const params = new URLSearchParams({ q: 'breaking bad' });
    expect(apiRoutes.tvshowSearch(params)).toBe('/api/tvshow/search?q=breaking+bad');
  });

  it('media routes use UUID path segments', () => {
    const id = '00000000-0000-4000-8000-000000000001';
    expect(apiRoutes.movieById(id)).toBe(`/api/movie/${id}/`);
    expect(apiRoutes.movieRefresh(id)).toBe(`/api/movie/${id}/refresh`);
    expect(apiRoutes.tvshowById(id)).toBe(`/api/tvshow/${id}/`);
    expect(apiRoutes.tvshowRefresh(id)).toBe(`/api/tvshow/${id}/refresh`);
    expect(apiRoutes.episodeById(id)).toBe(`/api/episode/${id}/`);
  });

  it('exposes static auth and resource paths', () => {
    expect(apiRoutes.auth.login).toBe('/api/auth/login');
    expect(apiRoutes.movie).toBe('/api/movie');
    expect(apiRoutes.tvshow).toBe('/api/tvshow');
    expect(apiRoutes.episode).toBe('/api/episode');
  });
});
