import { Alert, Anchor } from '@mantine/core';
import { redirect } from 'next/navigation';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { PublicPage } from '@/components/Layout/PublicPage';
import { canDeliverEmail } from '@/lib/email/config';
import { routes } from '@/lib/routes';
import { guardUser } from '@/utils/auth';

export default async function ForgotPasswordPage() {
  const user = await guardUser();
  if (user) redirect(routes.home);

  return (
    <PublicPage
      title="Forgot your password?"
      subtitle={
        <>
          Remembered it? <Anchor href={routes.signin}>Back to sign in</Anchor>
        </>
      }
    >
      {canDeliverEmail() ? (
        <ForgotPasswordForm />
      ) : (
        <Alert color="yellow">
          Password reset by email is not set up on this instance. Contact the administrator to reset your password.
        </Alert>
      )}
    </PublicPage>
  );
}
