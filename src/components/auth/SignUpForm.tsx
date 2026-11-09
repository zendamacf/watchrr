'use client';

import { Alert, Button, PasswordInput, TextInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { INVALID_EMAIL_MESSAGE, isValidEmail, normalizeEmail } from '@/lib/auth/email';
import { apiRoutes, routes } from '@/lib/routes';
import { ResendVerification } from './ResendVerification';

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawEmail = formData.get('email');
    const password = formData.get('password');

    if (typeof rawEmail !== 'string' || typeof password !== 'string') {
      setError('Email and password are required');
      return;
    }
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      setError(INVALID_EMAIL_MESSAGE);
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(apiRoutes.auth.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as { message?: string; requiresVerification?: boolean };

      if (!response.ok) {
        setError(body.message ?? 'Sign up failed');
        return;
      }

      if (body.requiresVerification) {
        setPendingVerification(email);
        return;
      }

      router.push(routes.home);
      router.refresh();
    } catch {
      setError('Sign up failed');
    } finally {
      setPending(false);
    }
  }

  if (pendingVerification) {
    return (
      <>
        <Alert color="green" mb="md" title="Check your email">
          We sent a confirmation link to {pendingVerification}. Click it to finish creating your account.
        </Alert>
        <ResendVerification email={pendingVerification} />
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}
      <TextInput label="Email" name="email" type="email" placeholder="email@example.com" required radius="md" />
      <PasswordInput label="Password" name="password" placeholder="Your password" required mt="md" radius="md" />
      <Button type="submit" fullWidth mt="xl" radius="md" loading={pending}>
        Sign Up
      </Button>
    </form>
  );
}
