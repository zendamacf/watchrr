'use client';

import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/QueryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <Notifications />
      <ModalsProvider>{children}</ModalsProvider>
    </QueryProvider>
  );
}
