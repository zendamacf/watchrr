import { Anchor } from '@mantine/core';
import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { PublicPage } from '@/components/Layout/PublicPage';
import { routes } from '@/lib/routes';
import { guardUser } from '@/utils/auth';

export default async function SignUpPage() {
  const user = await guardUser();
  if (user) redirect(routes.home);

  return (
    <PublicPage
      title="Sign Up"
      subtitle={
        <>
          Already have an account? <Anchor href={routes.signin}>Sign In</Anchor>
        </>
      }
    >
      <SignUpForm />
    </PublicPage>
  );
}
