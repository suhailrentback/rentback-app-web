// app/settings/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/** Server Supabase (anon) bound to Next cookies */
function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
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
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

/** 15.A — Update profile + persist language/theme cookies */
export async function updateProfile(formData: FormData) {
  "use server";

  const full_name = String(formData.get("full_name") || "");
  const language = String(formData.get("language") || "en");
  const theme = String(formData.get("theme") || "system");

  const sb = getServerSupabase();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) redirect("/auth/signin");

  await sb.from("profiles").upsert({
    id: user.id,
    full_name,
    language,
    theme,
    updated_at: new Date().toISOString(),
  });

  // Also set cookies used by the app shell
  const jar = cookies();
  const year = 60 * 60 * 24 * 365;
  jar.set({ name: "rb_lang", value: language, path: "/", maxAge: year });
  jar.set({ name: "rb_theme", value: theme, path: "/", maxAge: year });

  redirect("/settings?saved=1");
}

/** 15.B — Sign out everywhere (kills ALL sessions) + sign out current */
export async function signOutEverywhere() {
  "use server";

  const sb = getServerSupabase();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) redirect("/auth/signin");

  // Admin client with Service Role
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Kill ALL sessions for this user
  const { error: adminErr } = await admin.auth.admin.signOutUser(user.id);
  if (adminErr) {
    // Fallback: at least sign out this session
    await sb.auth.signOut({ scope: "global" }).catch(() => {});
    redirect("/auth/signin?e=1");
  }

  // Also end current session (just in case)
  await sb.auth.signOut({ scope: "global" }).catch(() => {});
  redirect("/auth/signin?signout=1");
}

export default async function SettingsPage() {
  const sb = getServerSupabase();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) redirect("/auth/signin");

  // Ensure row exists, then fetch
  await sb.from("profiles").upsert({ id: user.id }).select().single();
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();

  const currentLang = profile?.language ?? "en";
  const currentTheme = profile?.theme ?? "system";
  const fullName = profile?.full_name ?? "";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Profile form */}
      <form action={updateProfile} className="space-y-6 border rounded-2xl p-6">
        <h2 className="text-lg font-medium">Profile</h2>

        <div className="space-y-2">
          <label className="block text-sm">Full name</label>
          <input
            name="full_name"
            defaultValue={fullName}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Your name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm">Language</label>
            <select
              name="language"
              defaultValue={currentLang}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
            <p className="text-xs text-gray-500">Applies across the app (EN/UR).</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Theme</label>
            <select
              name="theme"
              defaultValue={currentTheme}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <p className="text-xs text-gray-500">You can still toggle in the header.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-2xl px-4 py-2 border shadow-sm"
          >
            Save
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <form action={signOutEverywhere} className="space-y-3 border rounded-2xl p-6">
        <h2 className="text-lg font-medium">Security</h2>
        <p className="text-sm text-gray-600">
          Sign out of all devices and sessions linked to your account.
        </p>
        <button
          type="submit"
          className="rounded-2xl px-4 py-2 border shadow-sm bg-red-600 text-white"
        >
          Sign out everywhere
        </button>
      </form>
    </div>
  );
}
