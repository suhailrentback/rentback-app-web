// app/landlord/invoices/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

// Keep schema loose to avoid TS compile traps
const Row = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
});

export default async function LandlordInvoicesIndex() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, total_amount, currency, due_date, issued_at")
    .order("issued_at", { ascending: false })
    .limit(50);

  if (error) notFound();

  const items = (data ?? []).map((d) => Row.parse(d));

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link
          href="/landlord/invoices/new"
          className="inline-flex items-center rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90"
        >
          + Create invoice
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border p-6 text-sm text-gray-600">
          No invoices yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Number</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Due</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-4">
                    <Link
                      className="text-blue-600 hover:underline"
                      href={`/landlord/invoices/${inv.id}`}
                    >
                      {inv.number ?? inv.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    {(inv.status ?? "").toUpperCase() || "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {typeof inv.total_amount === "number"
                      ? `${inv.total_amount} ${inv.currency ?? "PKR"}`
                      : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {inv.due_date
                      ? new Date(inv.due_date).toDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <Link href="/landlord" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}
