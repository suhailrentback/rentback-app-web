// app/tenant/lease/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type LeaseRow = {
  id: string;
  property_id: string | null;
  unit_id: string | null;
  landlord_id: string | null;
  tenant_id: string | null;
  rent_amount_cents: number | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  created_at: string | null;
};

type PropertyRow = {
  id: string;
  name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

type UnitRow = {
  id: string;
  name: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
};

function fmtMoney(cents?: number | null, currency?: string | null) {
  const c = typeof cents === "number" ? cents : 0;
  const cur = currency || "PKR";
  const amount = c / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(
      amount
    );
  } catch {
    return `${amount.toFixed(2)} ${cur}`;
  }
}

export default async function TenantLeasePage() {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => cookieStore.get(name)?.value },
  });

  // With RLS enabled, this returns only the signed-in tenant's leases.
  // We take the most recent one as "current".
  const { data: lease, error } = await supabase
    .from("leases")
    .select(
      "id, property_id, unit_id, landlord_id, tenant_id, rent_amount_cents, currency, start_date, end_date, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Render a friendly error rather than throwing (keeps Vercel logs clean)
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <h1 className="text-xl font-semibold">My lease</h1>
        <div className="mt-3 rounded-xl border p-4 text-sm">
          <div className="font-medium">Couldn’t load your lease.</div>
          <div className="mt-1 text-gray-600">Please try again in a moment.</div>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">My lease</h1>
          <div className="flex gap-3 text-sm">
            <Link href="/tenant/invoices" className="underline hover:no-underline">
              Invoices
            </Link>
            <Link href="/tenant/payments" className="underline hover:no-underline">
              Payments
            </Link>
          </div>
        </div>
        <div className="rounded-xl border p-6 text-sm">
          <div className="font-medium">No lease on file</div>
          <div className="mt-1 text-gray-600">
            When your landlord creates a lease for you, it will appear here with rent, dates, and property details.
          </div>
        </div>
      </div>
    );
  }

  // Fetch related property & unit (keep it simple: separate queries = fewer type surprises)
  const propertyId = lease.property_id ?? "";
  const unitId = lease.unit_id ?? "";

  const [{ data: property }, { data: unit }] = await Promise.all([
    propertyId
      ? supabase
          .from("properties")
          .select("id, name, address_line1, address_line2, city, state, postal_code, country")
          .eq("id", propertyId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    unitId
      ? supabase.from("units").select("id, name, bedrooms, bathrooms, sqft").eq("id", unitId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const leaseStart = lease.start_date ? new Date(lease.start_date).toDateString() : "—";
  const leaseEnd = lease.end_date ? new Date(lease.end_date).toDateString() : "—";
  const rent = fmtMoney(lease.rent_amount_cents ?? 0, lease.currency ?? "PKR");

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">My lease</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/tenant/invoices" className="underline hover:no-underline">
            Invoices
          </Link>
          <Link href="/tenant/payments" className="underline hover:no-underline">
            Payments
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm">
            <div className="font-medium">Rent</div>
            <div className="text-gray-700">{rent}</div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <div className="font-medium">Start date</div>
              <div className="text-gray-700">{leaseStart}</div>
            </div>
            <div>
              <div className="font-medium">End date</div>
              <div className="text-gray-700">{leaseEnd}</div>
            </div>
            <div>
              <div className="font-medium">Status</div>
              <div className="text-gray-700">{lease.status || "—"}</div>
            </div>
            <div>
              <div className="font-medium">Lease ID</div>
              <div className="text-gray-700">{lease.id}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm">
            <div className="font-medium">Property</div>
            <div className="text-gray-700">
              {property?.name || "—"}
              <div className="mt-1 text-gray-600">
                {[property?.address_line1, property?.address_line2].filter(Boolean).join(", ") || "—"}
                <br />
                {[
                  property?.city,
                  property?.state,
                  property?.postal_code,
                  property?.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm">
            <div className="font-medium">Unit</div>
            <div className="text-gray-700">
              {unit?.name || "—"}
              <div className="mt-1 text-gray-600">
                {[
                  unit?.bedrooms != null ? `${unit?.bedrooms} BR` : null,
                  unit?.bathrooms != null ? `${unit?.bathrooms} BA` : null,
                  unit?.sqft != null ? `${unit?.sqft} sqft` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4 text-xs text-gray-600">
          Data displayed here is read-only. Contact your landlord if something looks incorrect.
        </div>
      </div>
    </div>
  );
}
