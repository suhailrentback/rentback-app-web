// app/tenant/lease/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TenantLeasePage() {
  const supabase = createRouteSupabase();

  // Tenant can read own leases by RLS policy; no joins to properties/units
  const { data: leases, error } = await supabase
    .from("leases")
    .select("id, start_date, end_date, monthly_rent_cents, currency")
    .order("start_date", { ascending: false })
    .limit(1);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/tenant" className="text-sm underline">
            ← Back to dashboard
          </Link>
          <Link href="/sign-out" className="text-sm underline">
            Sign out
          </Link>
        </div>
        <h1 className="mb-2 text-xl font-semibold">My Lease</h1>
        <p className="text-sm text-red-600">Error loading lease: {String(error.message ?? "Unknown error")}</p>
      </div>
    );
  }

  const lease = leases?.[0];
  if (!lease) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/tenant" className="text-sm underline">
            ← Back to dashboard
          </Link>
          <Link href="/sign-out" className="text-sm underline">
            Sign out
          </Link>
        </div>
        <h1 className="mb-2 text-xl font-semibold">My Lease</h1>
        <p className="text-sm text-gray-500">No active lease found.</p>
      </div>
    );
  }

  const start = lease.start_date ? new Date(lease.start_date) : null;
  const end = lease.end_date ? new Date(lease.end_date) : null;
  const monthly =
    typeof lease.monthly_rent_cents === "number"
      ? (lease.monthly_rent_cents / 100).toFixed(2)
      : "—";

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/tenant" className="text-sm underline">
          ← Back to dashboard
        </Link>
        <Link href="/sign-out" className="text-sm underline">
          Sign out
        </Link>
      </div>

      <h1 className="mb-2 text-xl font-semibold">My Lease</h1>
      <p className="mb-6 text-sm text-gray-600">
        Read-only details of your current lease.
      </p>

      <div className="rounded-2xl border p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-gray-500">Lease ID</div>
          <div className="font-medium">{lease.id}</div>

          <div className="text-gray-500">Monthly Rent</div>
          <div className="font-medium">
            {monthly} {lease.currency ?? "PKR"}
          </div>

          <div className="text-gray-500">Start</div>
          <div className="font-medium">{start ? start.toDateString() : "—"}</div>

          <div className="text-gray-500">End</div>
          <div className="font-medium">{end ? end.toDateString() : "—"}</div>
        </div>
      </div>
    </div>
  );
}
