import { AuthedPage } from '@/components/Layout/AuthedPage';
import { DiscoverPage } from './DiscoverPage';

export default async function Page() {
  return <AuthedPage>{() => <DiscoverPage />}</AuthedPage>;
}
