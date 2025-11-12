// app/admin/staff/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string | null;
};

function Banner({ ok, error }: { ok?: string; error?: string }) {
  if (ok) {
    return (
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
        ✅ Role updated successfully.
      </div>
    );
  }
  if (error) {
    return (
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
        ⚠️ {error}
      </div>
    );
  }
  return null;
}

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => cookieStore.get(name)?.value },
  });

  // Optional: validate current user is staff/admin (middleware should already gate this)
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-xl border p-4">Not permitted.</div>
      </div>
    );
  }

  // Load all profiles to manage roles (keep list small for now; order by email)
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("email", { ascending: true })
    .limit(200);

  const ok = (searchParams["ok"] as string | undefined) || undefined;
  const err = (searchParams["error"] as string | undefined) || (error ? "Failed to load users." : undefined);

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Staff management</h1>
        <Link href="/admin" className="text-sm underline hover:no-underline">
          ← Back to Admin
        </Link>
      </div>

      <Banner ok={ok} error={err} />

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2 w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(profiles as ProfileRow[] | null)?.map((p) => {
              const email = p.email ?? "—";
              const role = (p.role ?? "tenant").toLowerCase();
              const id = p.id;

              const RoleButton = ({
                target,
                label,
              }: {
                target: "tenant" | "landlord" | "staff" | "admin";
                label: string;
              }) => (
                <form action="/admin/api/staff/set-role" method="POST" className="inline">
                  <input type="hidden" name="userId" value={id} />
                  <input type="hidden" name="newRole" value={target} />
                  <button
                    className="mr-2 rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    title={`Set role: ${target}`}
                  >
                    {label}
                  </button>
                </form>
              );

              return (
                <tr key={id} className="border-t">
                  <td className="px-3 py-2">{email}</td>
                  <td className="px-3 py-2 capitalize">{role}</td>
                  <td className="px-3 py-2">
                    <RoleButton target="tenant" label="Tenant" />
                    <RoleButton target="landlord" label="Landlord" />
                    <RoleButton target="staff" label="Staff" />
                    <RoleButton target="admin" label="Admin" />
                  </td>
                </tr>
              );
            }) ?? (
              <tr>
                <td className="px-3 py-3" colSpan={3}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Changes apply immediately and are enforced by RLS everywhere in the app.
      </p>
    </div>
  );
}
