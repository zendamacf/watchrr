import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { SiteHeader } from '../SiteHeader';

export async function AuthedPage({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect('/signin');
  }

  return (
    <div>
      <main>
        <SiteHeader />
        {children}
      </main>
    </div>
  );
}
