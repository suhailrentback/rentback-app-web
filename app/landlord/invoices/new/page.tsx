// app/landlord/invoices/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const Row = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  tenant_id: z.string(),
});
type Row = z.infer<typeof Row>;

export default async function LandlordInvoicesPage() {
  // Server component: safe to use server supabase
  const supabase = createServerSupabase();

  // NOTE: RLS must permit your role to SELECT; if not, this will just return 0 rows.
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, total_amount, currency, due_date, issued_at, tenant_id"
    )
    .order("issued_at", { ascending: false })
    .limit(100);

  if (error) {
    // Don’t surface details in prod UI; just 404 here
    notFound();
  }

  const parsed =
    Array.isArray(data) ? z.array(Row).safeParse(data) : { success: true, data: [] as Row[] };

  const rows: Row[] = parsed.success ? parsed.data : [];

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link
          href="/landlord/invoices/new"
          className="inline-flex items-center rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90"
        >
          Create invoice
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border p-6">
          <h2 className="font-medium mb-1">No invoices yet</h2>
          <p className="text-sm text-gray-600">
            When you create an invoice, it’ll show up here with its status and due date.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const total =
                  typeof inv.total_amount === "number"
                    ? `${inv.total_amount} ${inv.currency ?? ""}`.trim()
                    : "—";
                const due = inv.due_date ? new Date(inv.due_date).toDateString() : "—";
                const number = inv.number ?? inv.id.slice(0, 8).toUpperCase();

                return (
                  <tr key={inv.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/landlord/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 uppercase tracking-wide">
                      {(inv.status ?? "").toString()}
                    </td>
                    <td className="px-4 py-3">{total}</td>
                    <td className="px-4 py-3">{due}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Link href="/landlord" className="text-sm text-blue-600 hover:underline">
          ← Back to landlord home
        </Link>
      </div>
    </main>
  );
}
