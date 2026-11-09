import { Alert, Anchor } from '@mantine/core';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { PublicPage } from '@/components/Layout/PublicPage';
import { routes } from '@/lib/routes';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <PublicPage
      title="Choose a new password"
      subtitle={
        <>
          Changed your mind? <Anchor href={routes.signin}>Back to sign in</Anchor>
        </>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert color="red">
          This reset link is missing its token. <Anchor href={routes.forgotPassword}>Request a new link</Anchor>.
        </Alert>
      )}
    </PublicPage>
  );
}
