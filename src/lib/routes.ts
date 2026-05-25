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
  episodeById: (episodeId: string) => `/api/episode/${episodeId}/`,
  movie: '/api/movie',
  movieSearch: (searchParams: URLSearchParams | string) =>
    `/api/movie/search?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}`,
  movieById: (movieId: string) => `/api/movie/${movieId}/`,
  movieRefresh: (movieId: string) => `/api/movie/${movieId}/refresh`,
  tvshow: '/api/tvshow',
  tvshowSearch: (searchParams: URLSearchParams | string) =>
    `/api/tvshow/search?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}`,
  tvshowById: (tvshowId: string) => `/api/tvshow/${tvshowId}/`,
  tvshowRefresh: (tvshowId: string) => `/api/tvshow/${tvshowId}/refresh`,
} as const;
