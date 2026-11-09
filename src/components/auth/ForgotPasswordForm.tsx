'use client';

import { Alert, Button, TextInput } from '@mantine/core';
import { type FormEvent, useState } from 'react';
import { apiRoutes } from '@/lib/routes';

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    if (typeof email !== 'string' || !email.trim()) {
      setError('Email is required');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(apiRoutes.auth.forgotPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(body.message ?? 'Something went wrong');
        return;
      }
      setSent(true);
    } catch {
      setError('Something went wrong');
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <Alert color="green">
        If an account exists for that email, a reset link is on its way. The link expires in 60 minutes.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}
      <TextInput label="Email" name="email" type="email" placeholder="email@example.com" required radius="md" />
      <Button type="submit" fullWidth mt="xl" radius="md" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
