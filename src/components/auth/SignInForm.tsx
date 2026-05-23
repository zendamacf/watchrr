'use client';

import { Alert, Button, PasswordInput, TextInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { apiRoutes, routes } from '@/lib/routes';

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    if (typeof email !== 'string' || typeof password !== 'string') {
      setError('Email and password are required');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(apiRoutes.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(body.message ?? 'Sign in failed');
        return;
      }

      router.push(routes.home);
      router.refresh();
    } catch {
      setError('Sign in failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}
      <TextInput label="Email" name="email" placeholder="email@example.com" required radius="md" />
      <PasswordInput label="Password" name="password" placeholder="Your password" required mt="md" radius="md" />
      <Button type="submit" fullWidth mt="xl" radius="md" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
