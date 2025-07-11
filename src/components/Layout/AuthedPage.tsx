import { guardUser } from '@/utils/auth';
import { Container, Space } from '@mantine/core';
import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { ComponentType } from 'react';
import { SiteHeader } from '../SiteHeader';

export async function AuthedPage({ children: Child }: { children: ComponentType<{ user: User }> }) {
  const user = await guardUser();
  if (!user) redirect('/signin');

  return (
    <div>
      <main>
        <SiteHeader />
        <Container fluid>
          <Child user={user} />
          <Space style={{ height: '100px' }} />
        </Container>
      </main>
    </div>
  );
}
