import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { updateProfile } from './actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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
    return <div className="p-6">Please sign in to manage your settings.</div>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, display_name, phone, lang, timezone, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const p = profile ?? {};

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <form action={updateProfile} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <label className="grid gap-1">
            <span className="text-sm">Full name</span>
            <input
              name="full_name"
              defaultValue={p.full_name ?? ''}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Display name</span>
            <input
              name="display_name"
              defaultValue={p.display_name ?? ''}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Phone</span>
            <input
              name="phone"
              defaultValue={p.phone ?? ''}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Language</span>
            <input
              name="lang"
              defaultValue={p.lang ?? ''}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Time zone</span>
            <input
              name="timezone"
              defaultValue={p.timezone ?? ''}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Avatar URL</span>
            <input
              name="avatar_url"
              defaultValue={p.avatar_url ?? ''}
              className="border rounded-md px-3 py-2"
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-md px-4 py-2 border"
        >
          Save
        </button>
      </form>
    </div>
  );
}
