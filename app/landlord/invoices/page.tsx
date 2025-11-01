// app/landlord/invoices/page.tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  number: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
};

export default async function LandlordInvoicesPage() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, total_amount, currency, issued_at, due_date")
    .order("issued_at", { ascending: false });

  const invoices = (data ?? []) as Row[];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Landlord · Invoices</h1>
          <p className="text-sm text-gray-500">
            Create, review, and mark invoices as paid.
          </p>
        </div>
        <Link
          href="/landlord/invoices/new"
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          + Create invoice
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Failed to load invoices. Try again.
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm text-gray-600">
          No invoices yet. Click <span className="font-medium">Create invoice</span> to add one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isPaid = String(inv.status ?? "").toLowerCase() === "paid";
                return (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-3">
                      <span className="font-medium">
                        {inv.number ?? inv.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-1 text-xs " +
                          (isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700")
                        }
                      >
                        {(inv.status ?? "").toUpperCase() || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {typeof inv.total_amount === "number"
                        ? `${inv.total_amount} ${inv.currency ?? "PKR"}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {inv.due_date ? new Date(inv.due_date).toDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick view via Tenant detail page (useful for testing PDFs) */}
                        <Link
                          href={`/tenant/invoices/${inv.id}`}
                          className="rounded-xl border px-2 py-1 hover:bg-gray-50"
                        >
                          View
                        </Link>

                        {/* Mark Paid (server-side POST → redirects back) */}
                        <form
                          method="POST"
                          action={`/landlord/invoices/mark-paid/${inv.id}`}
                          className="inline"
                        >
                          <button
                            type="submit"
                            disabled={isPaid}
                            className="rounded-xl border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                            title={isPaid ? "Already paid" : "Mark as paid"}
                          >
                            Mark paid
                          </button>
                        </form>
                      </div>
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
