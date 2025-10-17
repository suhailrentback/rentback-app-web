// app/tenant/invoices/page.tsx
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

type Invoice = {
  id: string;
  ref: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  status: "draft" | "issued" | "paid" | "overdue";
  due_date: string | null;     // ISO (date) from Postgres
  issued_at: string | null;    // ISO (timestamp) from Postgres
  created_at: string;
};

function formatAmount(amount_cents: number, currency: string) {
  const amount = (amount_cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: currency || "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${currency || "PKR"}`;
  }
}

function StatusPill({ status }: { status: Invoice["status"] }) {
  const map: Record<Invoice["status"], { bg: string; text: string; label: string }> = {
    draft:   { bg: "bg-gray-100",   text: "text-gray-700",   label: "DRAFT" },
    issued:  { bg: "bg-amber-100",  text: "text-amber-800",  label: "ISSUED" },
    paid:    { bg: "bg-emerald-100",text: "text-emerald-800",label: "PAID" },
    overdue: { bg: "bg-rose-100",   text: "text-rose-800",   label: "OVERDUE" },
  };
  const c = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export const dynamic = "force-dynamic";

export default async function TenantInvoicesPage() {
  const supabase = createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Fallback: if somehow unauth, push to sign-in
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="mt-4 text-gray-600">You need to sign in to view invoices.</p>
        <Link className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" href="/sign-in">
          Sign in
        </Link>
      </div>
    );
  }

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, ref, description, amount_cents, currency, status, due_date, issued_at, created_at")
    .eq("tenant_id", user.id)
    .order("due_date", { ascending: true, nullsFirst: true })
    .limit(100);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
          Couldn’t load invoices: {error.message}
        </p>
      </div>
    );
  }

  const hasRows = (invoices?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/90">Tenant</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Transparent amounts, clear status, quick receipts (when paid).
          </p>
        </div>
        <Link
          href="/tenant"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          Back to dashboard
        </Link>
      </div>

      {!hasRows ? (
        <div className="mt-8 rounded-2xl border p-8 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-emerald-50"></div>
          <h2 className="text-lg font-semibold">No invoices yet</h2>
          <p className="mt-1 text-sm text-gray-600">
            When your landlord issues an invoice, it’ll show up here with its status and due date.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-gray-700">Invoice</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {invoices!.map((inv) => {
                const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—";
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.ref}</div>
                      <div className="text-xs text-gray-500">{inv.description ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">{formatAmount(inv.amount_cents, inv.currency)}</td>
                    <td className="px-4 py-3"><StatusPill status={inv.status} /></td>
                    <td className="px-4 py-3">{due}</td>
                    <td className="px-4 py-3">
                      {/* Placeholder actions; hook up when receipts/payments are ready */}
                      {inv.status === "paid" ? (
                        <button className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50" disabled>
                          Receipt
                        </button>
                      ) : (
                        <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700" disabled>
                          Pay
                        </button>
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
