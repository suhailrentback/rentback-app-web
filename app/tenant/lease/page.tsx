// app/tenant/lease/page.tsx
import { createServerSupabase } from "@/lib/supabase/server";
export const dynamic = "force-dynamic"; // optional, but OK for SSR lists

export default async function LeaseListPage() {
  const supabase = createServerSupabase();

  // Example nested select with defensive types
  const { data: leases, error } = await supabase
    .from("leases")
    .select(`
      id,
      start_date,
      end_date,
      unit:unit_id(
        unit_number,
        property:property_id(name)
      )
    `)
    .order("start_date", { ascending: false });

  if (error) {
    return <div className="p-4">Failed to load leases.</div>;
  }

  if (!leases?.length) {
    return <div className="p-4">No leases yet.</div>;
  }

  return (
    <div className="space-y-3 p-4">
      {leases.map((lease) => (
        <div key={lease.id} className="rounded-xl border p-4">
          <div className="font-semibold">
            {lease.unit?.property?.name ?? "Property"} — Unit{" "}
            {lease.unit?.unit_number ?? "—"}
          </div>
          <div className="text-sm opacity-80">
            {lease.start_date} → {lease.end_date ?? "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
