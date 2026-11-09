'use client';

import { Alert, Anchor, Button } from '@mantine/core';
import { useState } from 'react';
import { apiRoutes, routes } from '@/lib/routes';

export function VerifyEmailForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(apiRoutes.auth.verifyEmail, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(body.message ?? 'Verification failed');
        return;
      }
      setDone(true);
    } catch {
      setError('Verification failed');
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Alert color="green">
        Your email is confirmed. <Anchor href={routes.signin}>Sign in</Anchor> to get started.
      </Alert>
    );
  }

  return (
    <>
      {error && (
        <Alert color="red" mb="md">
          {error} <Anchor href={routes.signin}>Sign in</Anchor> to request a new link.
        </Alert>
      )}
      <Button fullWidth radius="md" loading={pending} onClick={handleClick}>
        Confirm email
      </Button>
    </>
  );
}
