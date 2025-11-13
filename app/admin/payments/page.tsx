// app/admin/payments/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServerSupabase() {
  const jar = cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      get: (name: string) => jar.get(name)?.value,
    },
  });
}

type Row = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string;
  created_at: string;
  confirmed_at: string | null;
  invoice: { id: string; number: string; due_date: string } | null;
};

function mapRows(data: any[] | null): Row[] {
  const arr = Array.isArray(data) ? data : [];
  return arr.map((r: any) => {
    const inv = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice;
    return {
      id: String(r.id),
      amount_cents: Number(r.amount_cents ?? 0),
      currency: String(r.currency ?? ""),
      status: String(r.status ?? ""),
      reference: String(r.reference ?? ""),
      created_at: String(r.created_at ?? ""),
      confirmed_at: r.confirmed_at ? String(r.confirmed_at) : null,
      invoice: inv
        ? {
            id: String(inv.id),
            number: String(inv.number),
            due_date: String(inv.due_date),
          }
        : null,
    };
  });
}

function fmtAmount(cents: number, currency: string) {
  const val = (cents ?? 0) / 100;
  return `${val.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const sb = getServerSupabase();

  // Filters
  const status = typeof searchParams.status === "string" ? searchParams.status : "";
  const currency = typeof searchParams.currency === "string" ? searchParams.currency : "";
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const from = typeof searchParams.from === "string" ? searchParams.from : ""; // ISO date (yyyy-mm-dd)
  const to = typeof searchParams.to === "string" ? searchParams.to : "";

  // Base query
  let query = sb
    .from("payments")
    .select(
      "id, amount_cents, currency, status, reference, created_at, confirmed_at, invoice:invoices(id, number, due_date)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (currency) query = query.eq("currency", currency);
  if (q) query = query.ilike("reference", `%${q}%`);
  if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59Z`);

  const { data, error } = await query;
  const rows = mapRows(data);

  return (
    <div className="mx-auto w-full max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payments (Admin)</h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/api/payments/export?${new URLSearchParams({
              status,
              currency,
              q,
              from,
              to,
            }).toString()}`}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Export CSV
          </Link>
          <Link href="/admin" className="text-sm underline">
            ← Back to Admin
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form className="rounded-2xl border p-4 grid gap-3 md:grid-cols-5">
        <input
          type="text"
          name="q"
          placeholder="Search reference…"
          defaultValue={q}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={status} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All status</option>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="failed">failed</option>
        </select>
        <input
          type="text"
          name="currency"
          placeholder="Currency (e.g. PKR)"
          defaultValue={currency}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.reference || "—"}</td>
                <td className="px-3 py-2">
                  {r.invoice ? (
                    <Link
                      href={`/landlord/invoices/${r.invoice.id}/edit`}
                      className="underline"
                    >
                      {r.invoice.number}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">{fmtAmount(r.amount_cents, r.currency)}</td>
                <td className="px-3 py-2 uppercase">{r.status}</td>
                <td className="px-3 py-2">
                  {r.confirmed_at ? new Date(r.confirmed_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {String(error.message || error)}
        </div>
      )}
    </div>
  );
}
