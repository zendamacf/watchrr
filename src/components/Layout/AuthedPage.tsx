import { Container, Space } from '@mantine/core';
import { redirect } from 'next/navigation';
import type { ComponentType } from 'react';
import { routes } from '@/lib/routes';
import { type AuthUser, guardUser } from '@/utils/auth';
import { SiteHeader } from '../SiteHeader';
import classes from './AuthedPage.module.css';

export async function AuthedPage({ children: Child }: { children: ComponentType<{ user: AuthUser }> }) {
  const user = await guardUser();
  if (!user) redirect(routes.signin);

  return (
    <div>
      <main>
        <SiteHeader />
        <Container fluid>
          <Child user={user} />
          <Space className={classes.bottomSpace} />
        </Container>
      </main>
    </div>
  );
}
