// app/debug/role/page.tsx
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function RoleDebugPage() {
  const cookieStore = cookies();
  const cookieRole = cookieStore.get("rb_role")?.value ?? "—";

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let email = "—";
  let userId = "—";
  let dbRole = "—";

  if (user) {
    email = user.email ?? "—";
    userId = user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();
    dbRole = profile?.role ?? "—";
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-3">
      <h1 className="text-xl font-semibold">Auth Debug</h1>
      <div className="text-sm"><b>Email:</b> {email}</div>
      <div className="text-sm"><b>User ID:</b> {userId}</div>
      <div className="text-sm"><b>DB role (profiles.role):</b> {dbRole}</div>
      <div className="text-sm"><b>Cookie role (rb_role):</b> {cookieRole}</div>
      <p className="text-xs text-gray-500">
        After changing DB role, open <code>/api/auth/sync</code> to refresh the cookie.
      </p>
    </div>
  );
}
