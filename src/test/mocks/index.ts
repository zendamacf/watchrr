import { resetAuthGuardMocks } from './auth';
import { resetRefresherMocks } from './refresher';
import { resetThemoviedbMocks } from './themoviedb';

export { mockGuardUser, resetAuthGuardMocks } from './auth';
export { mockRefreshMovie, mockRefreshTvShow, resetRefresherMocks } from './refresher';
export {
  mockGetAllEpisodes,
  mockGetMovie,
  mockGetTvShow,
  mockSearchMovies,
  mockSearchTvShows,
  resetThemoviedbMocks,
} from './themoviedb';

export function resetMediaMocks() {
  resetAuthGuardMocks();
  resetThemoviedbMocks();
  resetRefresherMocks();
}
