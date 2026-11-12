export const routes = {
  home: '/',
  episodes: '/episodes',
  shows: '/shows',
  showById: (tvshowId: string) => `/shows/${tvshowId}`,
  movies: '/movies',
  discover: '/discover',
  movieById: (movieId: string) => `/movies/${movieId}`,
  stats: '/stats',
  signin: '/signin',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
} as const;

export const apiRoutes = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    verifyEmail: '/api/auth/verify-email',
    resendVerification: '/api/auth/resend-verification',
  },
  episode: '/api/episode',
  episodeById: (episodeId: string) => `/api/episode/${episodeId}/`,
  movie: '/api/movie',
  movieSearch: (searchParams: URLSearchParams | string) =>
    `/api/movie/search?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}`,
  movieById: (movieId: string) => `/api/movie/${movieId}/`,
  movieRefresh: (movieId: string) => `/api/movie/${movieId}/refresh`,
  recommendations: (searchParams?: URLSearchParams | string) =>
    searchParams
      ? `/api/recommendations?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}`
      : '/api/recommendations',
  notInterested: '/api/recommendations/not-interested',
  stats: (searchParams?: URLSearchParams | string) =>
    searchParams
      ? `/api/stats?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}`
      : '/api/stats',
  tvshow: '/api/tvshow',
  tvshowSearch: (searchParams: URLSearchParams | string) =>
    `/api/tvshow/search?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}`,
  tvshowById: (tvshowId: string) => `/api/tvshow/${tvshowId}/`,
  tvshowEpisodes: (tvshowId: string) => `/api/tvshow/${tvshowId}/episodes/`,
  tvshowPreferences: (tvshowId: string) => `/api/tvshow/${tvshowId}/`,
  tvshowStats: (tvshowId: string, searchParams?: URLSearchParams | string) =>
    `/api/tvshow/${tvshowId}/stats${searchParams ? `?${typeof searchParams === 'string' ? searchParams : searchParams.toString()}` : ''}`,
  tvshowRefresh: (tvshowId: string) => `/api/tvshow/${tvshowId}/refresh`,
  tvshowSeasonWatch: (tvshowId: string, season: number) => `/api/tvshow/${tvshowId}/season/${season}/`,
} as const;
