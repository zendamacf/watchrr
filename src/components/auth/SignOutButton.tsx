'use client';

import { UnstyledButton, type UnstyledButtonProps } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRoutes, routes } from '@/lib/routes';

type SignOutButtonProps = UnstyledButtonProps & {
  onSignedOut?: () => void;
};

export function SignOutButton({ onSignedOut, ...props }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await fetch(apiRoutes.auth.logout, { method: 'POST' });
      onSignedOut?.();
      router.push(routes.home);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <UnstyledButton {...props} onClick={handleSignOut} data-disabled={pending || undefined}>
      Sign out
    </UnstyledButton>
  );
}
