import { signout } from '@/actions/auth/actions';

export async function GET() {
  await signout();
}
