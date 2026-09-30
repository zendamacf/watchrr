/** Paths that never require a session (pages and route handlers). */
const PUBLIC_PAGE_PATHS = new Set(['/signin', '/signup', '/health']);

/** Prefixes for infrastructure routes (e.g. Sentry tunnel) that must stay public. */
const PUBLIC_PAGE_PREFIXES = ['/monitoring'];

const PUBLIC_API_PATHS = new Set(['/api/auth/login', '/api/auth/signup', '/api/auth/logout', '/api/refresh']);

const STATIC_FILE_PATTERN = /\.[a-zA-Z0-9]+$/;

export function isPublicPagePath(pathname: string): boolean {
  if (PUBLIC_PAGE_PATHS.has(pathname)) return true;
  return PUBLIC_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isProtectedPagePath(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return false;
  if (isPublicPagePath(pathname)) return false;
  if (STATIC_FILE_PATTERN.test(pathname)) return false;
  return true;
}

export function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.has(pathname);
}

export function isProtectedApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/') && !isPublicApiPath(pathname);
}
