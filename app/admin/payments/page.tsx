// app/admin/payments/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Payment = {
  id: string;
  invoice_id: string | null;
  tenant_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
};

type Invoice = {
  id: string;
  number: string | null;
  due_date: string | null;
};

function formatMoney(cents: number, currency: string) {
  const amt = (Number(cents || 0) / 100).toFixed(2);
  return `${amt} ${currency}`;
}

function buildCsvHref(searchParams: Record<string, string | string[] | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") usp.set(k, v);
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
  }
  return `/admin/api/payments/export?${usp.toString()}`;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });

  // Guard: staff/admin only
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) redirect("/not-permitted");

  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["staff", "admin"].includes(String(me.role))) {
    redirect("/not-permitted");
  }

  // Filters
  const q = (searchParams?.q as string) || "";
  const status = (searchParams?.status as string) || "";
  const currency = (searchParams?.currency as string) || "";
  const from = (searchParams?.from as string) || "";
  const to = (searchParams?.to as string) || "";

  let query = sb
    .from("payments")
    .select(
      "id, invoice_id, tenant_id, amount_cents, currency, status, reference, created_at, confirmed_at"
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (currency) query = query.eq("currency", currency);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  if (q) {
    // basic ilike across reference (and later, tenant email via a view)
    query = query.ilike("reference", `%${q}%`);
  }

  const { data: payments, error } = await query.limit(200);
  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-xl font-semibold">Admin · Payments</h1>
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          Failed to load payments: {error.message}
        </p>
      </div>
    );
  }

  // Fetch related invoices in a second query to avoid brittle join typing
  const invoiceIds = Array.from(
    new Set((payments || []).map((p) => p.invoice_id).filter(Boolean) as string[])
  );
  let invoiceById = new Map<string, Invoice>();
  if (invoiceIds.length) {
    const { data: invoices } = await sb
      .from("invoices")
      .select("id, number, due_date")
      .in("id", invoiceIds);
    (invoices || []).forEach((inv) => invoiceById.set(inv.id, inv));
  }

  const csvHref = buildCsvHref(searchParams || {});

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin · Payments</h1>
        <div className="flex gap-2">
          <Link
            href="/admin"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            ← Admin home
          </Link>
          <a
            href={csvHref}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <input
          name="q"
          placeholder="Search reference…"
          defaultValue={q}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={status} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          name="currency"
          defaultValue={currency}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Any currency</option>
          <option value="PKR">PKR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
        <input
          type="datetime-local"
          name="from"
          defaultValue={from}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="datetime-local"
          name="to"
          defaultValue={to}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <div className="lg:col-span-5">
          <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
        </div>
      </form>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1 text-left">Created</th>
              <th className="border px-2 py-1 text-left">Invoice</th>
              <th className="border px-2 py-1 text-left">Reference</th>
              <th className="border px-2 py-1 text-left">Amount</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {(payments || []).map((p) => {
              const inv = p.invoice_id ? invoiceById.get(p.invoice_id) : null;
              return (
                <tr key={p.id}>
                  <td className="border px-2 py-1">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="border px-2 py-1">
                    {inv?.number || "—"} {inv?.id ? (
                      <Link className="text-blue-600 underline" href={`/tenant/invoices/${inv.id}`}>
                        View
                      </Link>
                    ) : null}
                  </td>
                  <td className="border px-2 py-1">{p.reference || "—"}</td>
                  <td className="border px-2 py-1">{formatMoney(p.amount_cents, p.currency)}</td>
                  <td className="border px-2 py-1">{p.status}</td>
                  <td className="border px-2 py-1">
                    {p.confirmed_at ? new Date(p.confirmed_at).toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
            {!payments?.length && (
              <tr>
                <td className="border px-2 py-4 text-center" colSpan={6}>
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
