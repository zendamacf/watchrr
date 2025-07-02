import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { ComponentType } from 'react';
import { SiteHeader } from '../SiteHeader';

export async function AuthedPage({ children: Child }: { children: ComponentType<{ user: User }> }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect('/signin');
  }

  return (
    <div>
      <main>
        <SiteHeader />
        <Child user={data.user} />
      </main>
    </div>
  );
}
