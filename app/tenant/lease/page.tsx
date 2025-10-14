// WEB /app/tenant/lease/page.tsx
import { createServerSupabase } from "../../lib/supabase/server.ts";
import Link from "next/link";

export const dynamic = "force-dynamic";

type MaybeArray<T> = T | T[] | null | undefined;

type LeaseRow = {
  id: string;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  status: string;
  unit?: MaybeArray<{
    unit_number?: string | null;
    property?: MaybeArray<{ name?: string | null }>;
  }>;
};

function firstOrUndefined<T>(v: MaybeArray<T>): T | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function MyLeasePage() {
  const supabase = createServerSupabase();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes?.user) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <p className="text-lg">
          Please{" "}
          <Link className="underline" href="/sign-in?next=/tenant/lease">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  const { data: leaseRaw } = await supabase
    .from("lease")
    .select(
      `
      id, start_date, end_date, rent_amount, status,
      unit:unit_id (
        unit_number,
        property:property_id ( name )
      )
    `
    )
    .eq("tenant_id", userRes.user.id)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lease = (leaseRaw ?? undefined) as unknown as LeaseRow | undefined;

  const unit = firstOrUndefined(lease?.unit);
  const property = firstOrUndefined(unit?.property);
  const propertyName = property?.name ?? "—";
  const unitNumber = unit?.unit_number ?? "—";

  return (
    <section className="max-w-3xl mx-auto py-16 space-y-6">
      <h1 className="text-2xl font-bold">My Lease</h1>

      {!lease ? (
        <p>No active lease found.</p>
      ) : (
        <div className="rounded-xl border p-4">
          <div className="font-semibold">
            {propertyName} — Unit {unitNumber}
          </div>
          <div className="text-sm opacity-80">
            {lease.start_date} → {lease.end_date ?? "—"}
          </div>
          <div className="mt-2">
            Rent:{" "}
            <span className="font-medium">
              Rs {Number(lease.rent_amount).toLocaleString()}
            </span>
          </div>
          <div className="text-sm mt-1">Status: {lease.status}</div>
        </div>
      )}

      <div>
        <Link className="underline" href="/tenant/payments">
          View my payments →
        </Link>
      </div>
    </section>
  );
}
