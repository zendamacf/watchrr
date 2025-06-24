import { login } from '@/actions/auth/actions';
import { createClient } from '@/utils/supabase/server';
import { Button, Card, Divider, PasswordInput, TextInput } from '@mantine/core';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/');
  }

  return (
    <main>
      <Card>
        <Card.Section>
          <div>
            <h1>Welcome</h1>
            <p>Enter your email below to login to your account</p>
          </div>
        </Card.Section>
        <Card.Section>
          <form>
            <TextInput type="email" label={'Email'} />
            <PasswordInput label={'Password'} />
            <Button formAction={login}>Sign in</Button>
          </form>
          <Divider />
          <Button>Sign in with Google</Button>
        </Card.Section>
      </Card>
    </main>
  );
}
