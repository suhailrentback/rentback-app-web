// app/admin/staff/page.tsx
import { revalidatePath } from "next/cache";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Allowed roles
const ROLES = ["tenant", "landlord", "staff", "admin"] as const;
type Role = (typeof ROLES)[number];

type ProfileRow = {
  id: string;
  email: string | null;
  role: Role | string | null;
  updated_at: string | null;
};

// --- Server action: set role ---
async function setRoleAction(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") || "");
  const newRole = String(formData.get("newRole") || "").toLowerCase();

  if (!userId || !ROLES.includes(newRole as Role)) {
    // ignore bad payloads to avoid noisy UI
    return;
  }

  const supabase = createRouteSupabase();
  const { error } = await supabase.rpc("admin_set_role", {
    target_user_id: userId,
    new_role: newRole,
  });

  // Silent failure to keep UX simple; in ops we can add toasts later.
  if (!error) {
    revalidatePath("/admin/staff");
  }
}

export default async function AdminStaffPage() {
  const supabase = createRouteSupabase();

  // Secure list (function itself verifies caller is admin/staff)
  const { data, error } = await supabase.rpc("admin_list_profiles");

  if (error) {
    // If middleware ever misses, this still protects the view
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-xl font-semibold mb-2">Not permitted</h1>
        <p className="text-sm text-gray-600">
          You don’t have permission to view this page.
        </p>
      </div>
    );
  }

  const rows = (data || []) as ProfileRow[];

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin · Staff & Roles</h1>
        <a
          href="/"
          className="text-sm underline hover:opacity-80"
        >
          Back to dashboard
        </a>
      </div>

      <div className="rounded-2xl border p-4">
        <div className="mb-3 text-sm text-gray-600">
          Promote/demote user roles. Admins can set any role; Staff can only set
          <span className="px-1 font-medium">tenant</span> or
          <span className="px-1 font-medium">landlord</span>.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Current role</th>
                <th className="py-2 pr-3">Updated</th>
                <th className="py-2 pr-3">Set role</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 pr-3">{r.email ?? "—"}</td>
                  <td className="py-2 pr-3">{r.role ?? "—"}</td>
                  <td className="py-2 pr-3">
                    {r.updated_at
                      ? new Date(r.updated_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <form action={setRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={r.id} />
                      <select
                        name="newRole"
                        defaultValue={(r.role ?? "tenant").toString()}
                        className="rounded-lg border px-2 py-1"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-xl border px-3 py-1 hover:bg-gray-50"
                        title="Apply role"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                  <td className="py-2 pr-3">
                    {/* Reserved for future: force sign-out, view activity, etc. */}
                    <span className="text-gray-400">—</span>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
