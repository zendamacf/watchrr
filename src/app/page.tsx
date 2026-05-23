import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';

export default async function Home() {
  return redirect(routes.episodes);
}
