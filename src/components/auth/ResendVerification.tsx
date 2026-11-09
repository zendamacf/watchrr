'use client';

import { Alert, Button } from '@mantine/core';
import { useState } from 'react';
import { apiRoutes } from '@/lib/routes';

/** Asks for a fresh verification email; the API answers generically whether or not it sent one. */
export function ResendVerification({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'pending' | 'sent' | 'failed'>('idle');

  async function handleClick() {
    setState('pending');
    try {
      const response = await fetch(apiRoutes.auth.resendVerification, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setState(response.ok ? 'sent' : 'failed');
    } catch {
      setState('failed');
    }
  }

  if (state === 'sent') {
    return <Alert color="green">If that account needs confirming, a new link is on its way.</Alert>;
  }

  return (
    <>
      {state === 'failed' && (
        <Alert color="red" mb="xs">
          Couldn't send a new link. Try again in a moment.
        </Alert>
      )}
      <Button variant="light" fullWidth radius="md" loading={state === 'pending'} onClick={handleClick}>
        Resend verification email
      </Button>
    </>
  );
}
