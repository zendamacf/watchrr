import { AuthedPage } from '@/components/Layout/AuthedPage';
import { EpisodeList } from './EpisodeList';

export default async function Page() {
  return <AuthedPage>{() => <EpisodeList />}</AuthedPage>;
}
