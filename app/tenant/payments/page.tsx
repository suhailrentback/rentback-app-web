// app/tenant/payments/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServerSupabase() {
  const jar = cookies();
  return createServerClient(URL, ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
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

export default async function TenantPaymentsPage() {
  const sb = getServerSupabase();

  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) {
    // not signed in
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <p className="text-sm">Please sign in to view your payments.</p>
      </div>
    );
  }

  const { data, error } = await sb
    .from("payments")
    .select(
      "id, amount_cents, currency, status, reference, created_at, confirmed_at, invoice:invoices(id, number, due_date)"
    )
    .eq("tenant_id", uid)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = mapRows(data);

  return (
    <div className="mx-auto w-full max-w-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Payments</h1>
        <Link href="/tenant" className="text-sm underline">
          ← Back to dashboard
        </Link>
      </div>

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
                <td className="px-3 py-2">{r.invoice ? r.invoice.number : "—"}</td>
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
                  No payments yet.
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
