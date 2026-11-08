/** True for the route itself and anything nested under it (e.g. /shows/123 is active for /shows). */
export const isActiveRoute = (pathname: string | null, href: string) =>
  pathname === href || !!pathname?.startsWith(`${href}/`);
