import { Alert, Anchor } from '@mantine/core';
import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { PublicPage } from '@/components/Layout/PublicPage';
import { isSignupEnabled } from '@/lib/auth/signup';
import { routes } from '@/lib/routes';
import { guardUser } from '@/utils/auth';

export default async function SignUpPage() {
  const user = await guardUser();
  if (user) redirect(routes.home);

  const signupEnabled = isSignupEnabled();

  return (
    <PublicPage
      title="Sign Up"
      subtitle={
        signupEnabled ? (
          <>
            Already have an account? <Anchor href={routes.signin}>Sign In</Anchor>
          </>
        ) : undefined
      }
    >
      {signupEnabled ? (
        <SignUpForm />
      ) : (
        <Alert color="yellow" title="Registration closed">
          New accounts cannot be created on this instance. If you already have an account,{' '}
          <Anchor href={routes.signin}>sign in</Anchor>.
        </Alert>
      )}
    </PublicPage>
  );
}
