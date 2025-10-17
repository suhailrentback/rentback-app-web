import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function OnboardingPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=/onboarding');

  // Ensure profile exists (trigger should handle new users)
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
  });

  // Read role and route
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'tenant';
  if (role === 'landlord') redirect('/landlord');
  if (role === 'staff') redirect('/admin');
  redirect('/tenant');
}
