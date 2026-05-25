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

  it('movieById and tvshowById accept numeric and string ids', () => {
    expect(apiRoutes.movieById(42)).toBe('/api/movie/42/');
    expect(apiRoutes.movieById('42')).toBe('/api/movie/42/');
    expect(apiRoutes.tvshowById(7)).toBe('/api/tvshow/7/');
    expect(apiRoutes.tvshowById('7')).toBe('/api/tvshow/7/');
  });

  it('media routes accept UUID path segments', () => {
    const uuid = '00000000-0000-4000-8000-000000000001';
    expect(apiRoutes.movieById(uuid)).toBe(`/api/movie/${uuid}/`);
    expect(apiRoutes.tvshowRefresh(uuid)).toBe(`/api/tvshow/${uuid}/refresh`);
    expect(apiRoutes.episodeById(uuid)).toBe(`/api/episode/${uuid}/`);
  });

  it('movieRefresh and tvshowRefresh build refresh paths', () => {
    expect(apiRoutes.movieRefresh(1)).toBe('/api/movie/1/refresh');
    expect(apiRoutes.tvshowRefresh('99')).toBe('/api/tvshow/99/refresh');
  });

  it('episodeById builds episode paths', () => {
    expect(apiRoutes.episodeById(5)).toBe('/api/episode/5/');
    expect(apiRoutes.episodeById('5')).toBe('/api/episode/5/');
  });

  it('exposes static auth and resource paths', () => {
    expect(apiRoutes.auth.login).toBe('/api/auth/login');
    expect(apiRoutes.movie).toBe('/api/movie');
    expect(apiRoutes.tvshow).toBe('/api/tvshow');
    expect(apiRoutes.episode).toBe('/api/episode');
  });
});
