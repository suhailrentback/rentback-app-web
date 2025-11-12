// app/admin/staff/page.tsx
import { createRouteSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";

type Role = "tenant" | "landlord" | "staff" | "admin";
const ROLES: Role[] = ["tenant", "landlord", "staff", "admin"];

async function requireStaffOrAdmin() {
  const supabase = createRouteSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { allowed: false as const, reason: "not_signed_in" };

  const { data: me } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  const allowed = me?.role === "staff" || me?.role === "admin";
  return { allowed: !!allowed, me };
}

export const dynamic = "force-dynamic";

export default async function StaffRolesPage() {
  const guard = await requireStaffOrAdmin();
  if (!guard.allowed) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-xl font-semibold mb-2">Not permitted</h1>
        <p className="text-sm text-gray-600">
          You must be STAFF or ADMIN to view this page.
        </p>
        <div className="mt-4">
          <Link href="/" className="text-sm underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const supabase = createRouteSupabase();
  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at, updated_at")
    .order("email", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-xl font-semibold mb-2">Staff management</h1>
        <p className="text-sm text-red-600">Failed to load users: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Staff management</h1>
        <Link href="/admin" className="text-sm underline">
          ← Back to admin
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className="rounded-full border px-2 py-0.5 text-xs">
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <RoleForm userId={u.id} newRole="tenant" current={u.role} />
                    <RoleForm userId={u.id} newRole="landlord" current={u.role} />
                    <RoleForm userId={u.id} newRole="staff" current={u.role} />
                    <RoleForm userId={u.id} newRole="admin" current={u.role} />
                  </div>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr>
                <td className="p-3 text-gray-600" colSpan={3}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Changes apply immediately and are enforced by RLS. This page is server-guarded.
      </p>
    </div>
  );
}

/** SERVER ACTION (same file, safe for Next 14) */
export async function setRoleAction(formData: FormData) {
  "use server";
  const supabase = createRouteSupabase();

  // Enforce requester is staff/admin
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { ok: false, error: "not_signed_in" };

  const { data: me } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!me || (me.role !== "staff" && me.role !== "admin"))
    return { ok: false, error: "forbidden" };

  const userId = String(formData.get("userId") ?? "");
  const newRole = String(formData.get("newRole") ?? "") as Role;
  if (!userId || !ROLES.includes(newRole)) {
    return { ok: false, error: "invalid_input" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/staff");
  return { ok: true };
}

/** Small server component wrapper that renders a form per role action */
function RoleForm(props: { userId: string; newRole: Role; current: string }) {
  const label =
    props.newRole === "tenant"
      ? "Set TENANT"
      : props.newRole === "landlord"
      ? "Set LANDLORD"
      : props.newRole === "staff"
      ? "Promote STAFF"
      : "Promote ADMIN";

  const subtle =
    props.current === props.newRole
      ? "opacity-60 cursor-default"
      : "";

  // Server component forms can submit to server actions directly
  return (
    <form action={setRoleAction}>
      <input type="hidden" name="userId" value={props.userId} />
      <input type="hidden" name="newRole" value={props.newRole} />
      <button
        type="submit"
        className={`rounded-lg border px-2 py-1 text-xs hover:bg-gray-50 ${subtle}`}
        disabled={props.current === props.newRole}
      >
        {label}
      </button>
    </form>
  );
}
