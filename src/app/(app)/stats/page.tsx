import { AuthedPage } from '@/components/Layout/AuthedPage';
import { StatsPage } from './StatsPage';

export default async function Page() {
  return <AuthedPage>{() => <StatsPage />}</AuthedPage>;
}
