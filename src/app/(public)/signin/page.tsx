import { Anchor } from '@mantine/core';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth/SignInForm';
import { PublicPage } from '@/components/Layout/PublicPage';
import { isSignupEnabled } from '@/lib/auth/signup';
import { routes } from '@/lib/routes';
import { guardUser } from '@/utils/auth';

export default async function SignInPage() {
  const user = await guardUser();
  if (user) redirect(routes.home);

  const signupEnabled = isSignupEnabled();

  return (
    <PublicPage
      title="Welcome back!"
      subtitle={
        signupEnabled ? (
          <>
            Do not have an account yet? <Anchor href={routes.signup}>Create an account</Anchor>
          </>
        ) : undefined
      }
    >
      <SignInForm />
    </PublicPage>
  );
}
