import { signup } from '@/actions/auth/actions';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/');
  }

  return (
    <main>
      <Card>
        <CardHeader>
          <div>
            <h1>Sign Up</h1>
            <p>Enter your email below to create a new account.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="m@example.com" required type="email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" required type="password" maxLength={72} />
            </div>
            <Button formAction={signup}>Sign Up</Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link href="/signin">Already have an account? Sign In</Link>
        </CardFooter>
      </Card>
    </main>
  );
}
