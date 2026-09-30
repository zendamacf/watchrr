import { AuthedPage } from '@/components/Layout/AuthedPage';
import { ShowDetailPage } from './ShowDetailPage';

export default async function Page({ params }: { params: Promise<{ tvshow_id: string }> }) {
  const { tvshow_id } = await params;
  return <AuthedPage>{() => <ShowDetailPage tvshowId={tvshow_id} />}</AuthedPage>;
}
