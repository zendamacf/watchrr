'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';
import { createClient } from '@/utils/supabase/server';

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  if (!data.email || !data.password) throw new Error('Please provide both your email & password.');

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.home, 'layout');
  redirect(routes.signin);
}

export async function signin(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  if (!data.email || !data.password) throw new Error('Please provide both your email & password.');

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.home, 'layout');
  redirect(routes.home);
}

export async function signout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  redirect(routes.signin);
}
