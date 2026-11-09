'use client';

import { Group, UnstyledButton, type UnstyledButtonProps } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { apiRoutes, routes } from '@/lib/routes';

type SignOutButtonProps = UnstyledButtonProps & {
  onSignedOut?: () => void;
  icon?: ReactNode;
};

export function SignOutButton({ onSignedOut, icon, ...props }: SignOutButtonProps) {
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
      {icon ? (
        <Group gap="xs" component="span">
          {icon}
          Sign out
        </Group>
      ) : (
        'Sign out'
      )}
    </UnstyledButton>
  );
}
