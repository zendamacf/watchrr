export const routes = {
  home: '/',
  episodes: '/episodes',
  shows: '/shows',
  movies: '/movies',
  signin: '/signin',
  signup: '/signup',
} as const;

export const apiRoutes = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
  },
  episode: '/api/episode',
  episodeById: (episodeUuid: string) => `/api/episode/${episodeUuid}/`,
  movie: '/api/movie',
  movieSearch: (searchParams: URLSearchParams | string) =>
    `/api/movie/search?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}`,
  movieById: (movieUuid: string) => `/api/movie/${movieUuid}/`,
  movieRefresh: (movieUuid: string) => `/api/movie/${movieUuid}/refresh`,
  tvshow: '/api/tvshow',
  tvshowSearch: (searchParams: URLSearchParams | string) =>
    `/api/tvshow/search?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}`,
  tvshowById: (tvshowUuid: string) => `/api/tvshow/${tvshowUuid}/`,
  tvshowRefresh: (tvshowUuid: string) => `/api/tvshow/${tvshowUuid}/refresh`,
} as const;
