// app/admin/payments/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InvoiceLite = {
  id: string;
  number: string | null;
  due_date: string | null;
} | null;

type Row = {
  id: string;
  amount_cents: number | null;
  currency: string | null;
  status: string; // "submitted" | "confirmed" | etc.
  reference: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  invoice: InvoiceLite;
};

function firstInvoice(inv: any): InvoiceLite {
  if (!inv) return null;
  if (Array.isArray(inv)) return inv.length ? (inv[0] ?? null) : null;
  return inv as InvoiceLite;
}

function formatMoney(amount_cents: number | null | undefined, currency: string | null | undefined) {
  const amt = typeof amount_cents === "number" ? amount_cents : 0;
  const ccy = currency ?? "PKR";
  return `${(amt / 100).toLocaleString()} ${ccy}`;
}

async function getSupabaseServer() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

async function fetchRows(): Promise<Row[]> {
  const sb = await getSupabaseServer();

  const { data, error } = await sb
    .from("payments")
    .select(
      `
      id, amount_cents, currency, status, reference, created_at, confirmed_at,
      invoice:invoices!payments_invoice_id_fkey ( id, number, due_date )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin/payments] select error", error);
    return [];
  }

  const rows: Row[] = (data ?? []).map((d: any) => {
    const inv = firstInvoice(d.invoice);
    return {
      id: String(d.id),
      amount_cents: typeof d.amount_cents === "number" ? d.amount_cents : Number(d.amount_cents ?? 0),
      currency: (d.currency ?? null) as string | null,
      status: String(d.status ?? ""),
      reference: (d.reference ?? null) as string | null,
      created_at: (d.created_at ?? null) as string | null,
      confirmed_at: (d.confirmed_at ?? null) as string | null,
      invoice: inv
    };
  });

  return rows;
}

export default async function AdminPaymentsPage() {
  const rows = await fetchRows();

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin · Payments Queue</h1>
        <Link
          href="/landlord"
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Landlord Home
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm text-gray-600">
          No payments yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const invNo = r.invoice?.number ?? "—";
                const invId = r.invoice?.id ?? null;
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                    <td className="px-3 py-2">
                      {invId ? (
                        <Link
                          href={`/tenant/invoices/${invId}`}
                          className="underline"
                        >
                          {invNo}
                        </Link>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{formatMoney(r.amount_cents, r.currency)}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.reference ?? "—"}</td>
                    <td className="px-3 py-2">
                      {r.created_at ? new Date(r.created_at).toDateString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <form action="/app/admin/api/payments/confirm" method="post" className="inline">
                        <input type="hidden" name="paymentId" value={r.id} />
                        <button
                          type="submit"
                          disabled={r.status !== "submitted"}
                          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                          title={r.status !== "submitted" ? "Only submitted payments can be confirmed" : "Confirm payment"}
                        >
                          Confirm
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
