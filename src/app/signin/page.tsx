import { signin } from '@/actions/auth/actions';
import { PublicPage } from '@/components/Layout/PublicPage';
import { routes } from '@/lib/routes';
import { guardUser } from '@/utils/auth';
import { Anchor, Button, PasswordInput, TextInput } from '@mantine/core';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const user = await guardUser();
  if (user) redirect(routes.home);

  return (
    <PublicPage
      title={'Welcome back!'}
      subtitle={
        <>
          Do not have an account yet? <Anchor href={routes.signup}>Create an account</Anchor>
        </>
      }
    >
      <form action={signin}>
        <TextInput
          label="Email"
          name="email"
          placeholder="email@example.com"
          required
          radius="md"
        />
        <PasswordInput
          label="Password"
          name="password"
          placeholder="Your password"
          required
          mt="md"
          radius="md"
        />
        <Button type={'submit'} fullWidth mt="xl" radius="md">
          Sign in
        </Button>
      </form>
    </PublicPage>
  );
}
