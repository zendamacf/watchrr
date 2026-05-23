import '@mantine/notifications/styles.css';

import type { ReactNode } from 'react';
import { AppProviders } from '@/components/Layout/AppProviders';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
