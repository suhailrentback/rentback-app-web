// app/settings/page.tsx
import { redirect } from "next/navigation";
import getSupabaseServer from "@/lib/supabase/server";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  lang: string | null;      // "en" | "ur" if you want to narrow it
  timezone: string | null;
  avatar_url: string | null;
  updated_at?: string | null;
};

export default async function SettingsPage() {
  const sb = getSupabaseServer();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("id, full_name, display_name, phone, lang, timezone, avatar_url")
    .eq("id", user!.id)
    .maybeSingle();

  // Give TypeScript a proper shape so p.full_name, etc. type-check.
  const p: Partial<Profile> = profile ?? {};

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <form action={updateProfile} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <label className="grid gap-1">
            <span className="text-sm">Full name</span>
            <input
              name="full_name"
              defaultValue={p.full_name ?? ""}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Display name</span>
            <input
              name="display_name"
              defaultValue={p.display_name ?? ""}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Phone</span>
            <input
              name="phone"
              defaultValue={p.phone ?? ""}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Language</span>
            <select
              name="lang"
              defaultValue={p.lang ?? "en"}
              className="border rounded-md px-3 py-2"
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Timezone</span>
            <input
              name="timezone"
              defaultValue={p.timezone ?? ""}
              className="border rounded-md px-3 py-2"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Avatar URL</span>
            <input
              name="avatar_url"
              defaultValue={p.avatar_url ?? ""}
              className="border rounded-md px-3 py-2"
            />
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-black text-white hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
