import { signin } from '@/actions/auth/actions';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default async function SignInPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/');
  }

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
          <CardAction>
            <Link href="/signup">Sign Up</Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form>
            <div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required />
              </div>
              <div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <a href="#">Forgot your password?</a>
                </div>
                <Input id="password" type="password" required />
                <Button formAction={signin}>Sign in</Button>
              </div>
            </div>
          </form>
          <Separator />
          <div>
            <Button variant="outline">Sign in with Google</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
