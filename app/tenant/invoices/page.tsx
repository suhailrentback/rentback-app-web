// app/tenant/invoices/page.tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

function formatMoney(raw: any) {
  const currency = (raw?.currency || "PKR") as string;
  const amount =
    typeof raw?.amount_cents === "number"
      ? raw.amount_cents / 100
      : typeof raw?.amount === "number"
      ? raw.amount
      : 0;
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status || "issued").toLowerCase();
  const base = "rounded-full px-2.5 py-1 text-xs font-medium ring-1";
  if (s === "paid") return <span className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}>PAID</span>;
  if (s === "overdue") return <span className={`${base} bg-red-50 text-red-700 ring-red-200`}>OVERDUE</span>;
  return <span className={`${base} bg-amber-50 text-amber-800 ring-amber-200`}>{s.toUpperCase()}</span>;
}

export default async function TenantInvoicesPage() {
  const supabase = createServerSupabase();

  // RLS should scope rows to the signed-in tenant
  const { data: invoices = [], error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  // Soft-fail: show empty state on error to avoid leaking details
  const rows = error ? [] : invoices;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Transparent amounts, clear status, quick receipts (when paid).
          </p>
        </div>
        <Link
          href="/tenant"
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          Back to dashboard
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border p-8 text-center">
          <h2 className="text-lg font-semibold">No invoices yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            When your landlord issues an invoice, it’ll show up here with its status and due date.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-700">
              <tr>
                <th className="py-3 pl-4 pr-3">Invoice</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Due</th>
                <th className="px-3 py-3">Status</th>
                <th className="py-3 pl-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row: any) => {
                const id = row.id as string;
                const num = row.number ?? `#${String(id).slice(0, 8)}`;
                const href = `/tenant/invoices/${id}`;
                return (
                  <tr key={id} className="hover:bg-gray-50">
                    {/* Make the first cell (Invoice) a link to the detail page */}
                    <td className="py-3 pl-4 pr-3 text-sm font-medium text-gray-900">
                      <Link href={href} className="hover:underline">
                        {num}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">{formatMoney(row)}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{formatDate(row.due_date)}</td>
                    <td className="px-3 py-3 text-sm">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right text-sm">
                      <Link
                        href={href}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        View
                      </Link>
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
