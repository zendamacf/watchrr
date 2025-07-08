import { AuthedPage } from '@/components/Layout/AuthedPage';
import { ShowPage } from './ShowPage';

export default async function Page() {
  return <AuthedPage>{(props) => <ShowPage {...props} />}</AuthedPage>;
}
