import { resetAuthGuardMocks } from './auth';
import { resetThemoviedbMocks } from './themoviedb';

export { mockGuardUser, resetAuthGuardMocks } from './auth';
export {
  mockGetAllEpisodes,
  mockGetMovie,
  mockGetTvShow,
  mockSearchMovies,
  mockSearchTvShows,
  resetThemoviedbMocks,
} from './themoviedb';

/** Resets auth guard and TMDB mocks. For refresher mocks, import `@/test/mocks/refresher` separately. */
export function resetMediaMocks() {
  resetAuthGuardMocks();
  resetThemoviedbMocks();
}
