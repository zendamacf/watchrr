import { describe, expect, it } from 'vitest';
import { isProtectedApiPath, isProtectedPagePath, isPublicApiPath, isPublicPagePath } from './middleware-config';

describe('middleware path config', () => {
  it('marks sign-in, sign-up, and health as public pages', () => {
    expect(isPublicPagePath('/signin')).toBe(true);
    expect(isPublicPagePath('/signup')).toBe(true);
    expect(isPublicPagePath('/health')).toBe(true);
    expect(isProtectedPagePath('/signin')).toBe(false);
  });

  it('protects app pages by default', () => {
    expect(isProtectedPagePath('/')).toBe(true);
    expect(isProtectedPagePath('/episodes')).toBe(true);
    expect(isProtectedPagePath('/shows')).toBe(true);
    expect(isProtectedPagePath('/movies')).toBe(true);
    expect(isProtectedPagePath('/settings')).toBe(true);
  });

  it('allows the Sentry tunnel without a session', () => {
    expect(isPublicPagePath('/monitoring')).toBe(true);
    expect(isPublicPagePath('/monitoring/envelope')).toBe(true);
    expect(isProtectedPagePath('/monitoring')).toBe(false);
  });

  it('does not treat static asset paths as protected pages', () => {
    expect(isProtectedPagePath('/favicon.ico')).toBe(false);
    expect(isProtectedPagePath('/logo.png')).toBe(false);
  });

  it('lists public API routes explicitly', () => {
    expect(isPublicApiPath('/api/auth/login')).toBe(true);
    expect(isPublicApiPath('/api/auth/signup')).toBe(true);
    expect(isPublicApiPath('/api/auth/logout')).toBe(true);
    expect(isPublicApiPath('/api/refresh')).toBe(true);
    expect(isPublicApiPath('/api/movie')).toBe(false);
  });

  it('requires auth for other API routes', () => {
    expect(isProtectedApiPath('/api/movie')).toBe(true);
    expect(isProtectedApiPath('/api/tvshow/search')).toBe(true);
    expect(isProtectedApiPath('/api/refresh')).toBe(false);
  });
});
