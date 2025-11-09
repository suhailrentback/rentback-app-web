// app/tenant/lease/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

type Profile = {
  id: string;
  email: string | null;
  role: "tenant" | "landlord" | "staff" | "admin";
  full_name: string | null;
};

type LeaseRow = {
  id: string;
  property_id: string;
  unit_id: string;
  start_date: string;
  end_date: string | null;
  status: "active" | "ended" | "pending";
};

type PropertyRow = { id: string; name: string };
type UnitRow = { id: string; unit_number: string };

function getSupabaseServer() {
  const store = cookies();
  // Read-only cookie access is enough for SSR auth; no-ops for set/remove keep typing happy.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

export default async function TenantLeasePage() {
  const supabase = getSupabaseServer();

  // Guard: must be signed in
  const { data: userResp } = await supabase.auth.getUser();
  const user = userResp?.user;
  if (!user) redirect("/sign-in");

  // Load profile for role-aware rendering
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, email, role, full_name")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (pErr || !profile) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">My Lease</h1>
        <p className="mt-2 text-sm text-red-600">Profile not found.</p>
      </div>
    );
  }

  // Try to fetch the most recent non-ended lease for this tenant
  let lease: LeaseRow | null = null;
  let lErr: any = null;

  {
    const { data, error } = await supabase
      .from("leases")
      .select("id, property_id, unit_id, start_date, end_date, status")
      .eq("tenant_id", profile.id)
      .neq("status", "ended")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle<LeaseRow>();

    lease = data ?? null;
    lErr = error ?? null;
  }

  // If RLS blocks tenants for now, or simply no leases yet, render a friendly message.
  if (lErr || !lease) {
    const msg =
      lErr && (lErr.code === "42501" || lErr.message?.includes("permission"))
        ? "Your lease will appear here once access is enabled."
        : "No active lease found yet.";

    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">My Lease</h1>
        <p className="mt-2 text-sm text-gray-600">{msg}</p>
      </div>
    );
  }

  // Load property & unit (separate simple queries to avoid relationship typing surprises)
  let property: PropertyRow | null = null;
  let unit: UnitRow | null = null;

  {
    const { data } = await supabase
      .from("properties")
      .select("id, name")
      .eq("id", lease.property_id)
      .maybeSingle<PropertyRow>();
    property = data ?? null;
  }

  {
    const { data } = await supabase
      .from("units")
      .select("id, unit_number")
      .eq("id", lease.unit_id)
      .maybeSingle<UnitRow>();
    unit = data ?? null;
  }

  const start = new Date(lease.start_date).toDateString();
  const end = lease.end_date ? new Date(lease.end_date).toDateString() : "—";
  const where = [
    property?.name ? `Property: ${property.name}` : null,
    unit?.unit_number ? `Unit: ${unit.unit_number}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">My Lease</h1>

      <div className="mt-4 rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {where || "Property details unavailable"}
          </span>
          <span className="rounded-full border px-2 py-0.5 text-xs">
            {lease.status.toUpperCase()}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Start date</dt>
            <dd className="font-medium">{start}</dd>
          </div>
          <div>
            <dt className="text-gray-500">End date</dt>
            <dd className="font-medium">{end}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        If this looks wrong, contact support@rentback.app.
      </p>
    </div>
  );
}
