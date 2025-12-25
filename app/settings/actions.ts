'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';

export async function updateProfile(formData: FormData) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/signin');
  }

  // Collect known profile fields from the form (expand as needed)
  const patch: Record<string, any> = {};
  for (const key of ['full_name', 'display_name', 'phone', 'lang', 'timezone', 'avatar_url']) {
    const v = formData.get(key);
    if (v !== null) patch[key] = String(v).trim();
  }

  if (Object.keys(patch).length > 0) {
    patch.updated_at = new Date().toISOString();
    await supabase.from('profiles').update(patch).eq('id', user!.id);
  }

  // Refresh the settings page data
  revalidatePath('/settings');
  return { ok: true };
}
