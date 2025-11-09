// app/tenant/payments/page.tsx
import Link from "next/link";
import { createRouteSupabase } from "@/lib/supabase/server";

export const revalidate = 0;

type PaymentRow = {
  id: string;
  amount_cents: number;
  currency: string | null;
  status: "submitted" | "confirmed" | "rejected" | string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
  invoice?: {
    id: string;
    number: string | null;
    due_date: string | null;
  } | null;
};

function formatMoney(cents: number | null | undefined, currency: string | null | undefined) {
  const amt = typeof cents === "number" ? cents / 100 : 0;
  const cur = currency || "PKR";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(amt);
  } catch {
    // Fallback if currency code is unknown on this runtime
    return `${amt.toLocaleString()} ${cur}`;
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const tone =
    s === "confirmed"
      ? "bg-green-100 text-green-800"
      : s === "submitted"
      ? "bg-yellow-100 text-yellow-800"
      : s === "rejected"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
  const label = s ? s.toUpperCase() : "UNKNOWN";
  return <span className={`${base} ${tone}`}>{label}</span>;
}

export default async function TenantPaymentsPage() {
  const supabase = createRouteSupabase();

  // RLS will scope rows to the signed-in tenant
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      amount_cents,
      currency,
      status,
      reference,
      created_at,
      confirmed_at,
      invoice:invoices (
        id,
        number,
        due_date
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data as PaymentRow[] | null) || [];

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4">
        <Link href="/tenant" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">My Payments</h1>
      <p className="mt-1 text-sm text-gray-600">
        Your recent rent payments. Confirmed items will also appear on receipts.
      </p>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load payments. Please try again.
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-lg border p-6 text-center text-sm text-gray-600">
          No payments yet.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Invoice</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Reference</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Amount</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((p) => {
                const created = p.created_at
                  ? new Date(p.created_at).toDateString()
                  : "";
                const amount = formatMoney(p.amount_cents, p.currency);
                const invNum = p.invoice?.number || "—";
                const invLink = p.invoice?.id
                  ? `/tenant/invoices/${p.invoice.id}`
                  : null;

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{created}</td>
                    <td className="px-3 py-2">
                      {invLink ? (
                        <Link href={invLink} className="text-blue-600 hover:underline">
                          {invNum}
                        </Link>
                      ) : (
                        invNum
                      )}
                    </td>
                    <td className="px-3 py-2">{p.reference || "—"}</td>
                    <td className="px-3 py-2">{amount}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={p.status} />
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
