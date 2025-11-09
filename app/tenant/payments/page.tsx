// app/tenant/payments/page.tsx
import Link from "next/link";
import { createRouteSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: string;
  invoice_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string;
  paid_at: string | null;
  created_at: string | null;
};

export default async function TenantPaymentsPage() {
  const supabase = createRouteSupabase();

  // Tenant can read own payments by RLS policy
  const { data, error } = await supabase
    .from("payments")
    .select("id, invoice_id, amount_cents, currency, status, paid_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const payments = (data ?? []) as PaymentRow[];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/tenant" className="text-sm underline">
          ← Back to dashboard
        </Link>
        <Link href="/sign-out" className="text-sm underline">
          Sign out
        </Link>
      </div>

      <h1 className="mb-2 text-xl font-semibold">My Payments</h1>
      <p className="mb-6 text-sm text-gray-600">
        Read-only list of your payments (latest first).
      </p>

      {error ? (
        <p className="text-sm text-red-600">Error loading payments: {String(error.message ?? "Unknown error")}</p>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-600">
          No payments yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Paid at</th>
                <th className="px-4 py-3 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const amt =
                  typeof p.amount_cents === "number"
                    ? (p.amount_cents / 100).toFixed(2)
                    : "—";
                const created = p.created_at ? new Date(p.created_at).toDateString() : "—";
                const paid = p.paid_at ? new Date(p.paid_at).toDateString() : "—";
                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">{created}</td>
                    <td className="px-4 py-3">
                      {amt} {p.currency ?? "PKR"}
                    </td>
                    <td className="px-4 py-3 uppercase">{p.status}</td>
                    <td className="px-4 py-3">{paid}</td>
                    <td className="px-4 py-3">
                      {p.invoice_id ? (
                        <Link
                          href={`/tenant/invoices/${p.invoice_id}`}
                          className="underline"
                        >
                          View invoice
                        </Link>
                      ) : (
                        "—"
                      )}
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
