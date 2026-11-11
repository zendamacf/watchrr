import { AuthedPage } from '@/components/Layout/AuthedPage';
import { MovieDetailPage } from './MovieDetailPage';

export default async function Page({ params }: { params: Promise<{ movie_id: string }> }) {
  const { movie_id } = await params;
  return <AuthedPage>{() => <MovieDetailPage movieId={movie_id} />}</AuthedPage>;
}
