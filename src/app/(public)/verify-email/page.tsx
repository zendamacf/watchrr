import { Alert, Anchor } from '@mantine/core';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';
import { PublicPage } from '@/components/Layout/PublicPage';
import { routes } from '@/lib/routes';

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <PublicPage
      title="Confirm your email"
      subtitle={
        <>
          Already confirmed? <Anchor href={routes.signin}>Back to sign in</Anchor>
        </>
      }
    >
      {token ? (
        <VerifyEmailForm token={token} />
      ) : (
        <Alert color="red">
          This link is missing its token. <Anchor href={routes.signin}>Sign in</Anchor> to request a new one.
        </Alert>
      )}
    </PublicPage>
  );
}
