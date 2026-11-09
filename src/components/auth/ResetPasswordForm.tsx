'use client';

import { Alert, Anchor, Button, PasswordInput } from '@mantine/core';
import { type FormEvent, useState } from 'react';
import { apiRoutes, routes } from '@/lib/routes';

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password');
    const confirm = formData.get('confirm');

    if (typeof password !== 'string' || !password) {
      setError('Password is required');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(apiRoutes.auth.resetPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(body.message ?? 'Password reset failed');
        return;
      }
      setDone(true);
    } catch {
      setError('Password reset failed');
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Alert color="green">
        Your password has been updated and you have been signed out on all devices.{' '}
        <Anchor href={routes.signin}>Sign in</Anchor> with your new password.
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
      <PasswordInput label="New password" name="password" placeholder="New password" required radius="md" />
      <PasswordInput
        label="Confirm password"
        name="confirm"
        placeholder="Repeat new password"
        required
        mt="md"
        radius="md"
      />
      <Button type="submit" fullWidth mt="xl" radius="md" loading={pending}>
        Reset password
      </Button>
    </form>
  );
}
