import { routes } from '@/lib/routes';
import { redirect } from 'next/navigation';

export default async function Home() {
  return redirect(routes.episodes);
}
