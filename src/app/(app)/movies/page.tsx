import { AuthedPage } from '@/components/Layout/AuthedPage';
import { MoviePage } from './MoviePage';

export default async function Page() {
  return <AuthedPage>{() => <MoviePage />}</AuthedPage>;
}
