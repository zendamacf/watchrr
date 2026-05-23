import { Anchor } from '@mantine/core';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth/SignInForm';
import { PublicPage } from '@/components/Layout/PublicPage';
import { routes } from '@/lib/routes';
import { guardUser } from '@/utils/auth';

export default async function SignInPage() {
  const user = await guardUser();
  if (user) redirect(routes.home);

  return (
    <PublicPage
      title="Welcome back!"
      subtitle={
        <>
          Do not have an account yet? <Anchor href={routes.signup}>Create an account</Anchor>
        </>
      }
    >
      <SignInForm />
    </PublicPage>
  );
}
