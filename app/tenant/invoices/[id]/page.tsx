import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

// Ensure this page runs per-request (so cookies/auth work in prod)
export const dynamic = "force-dynamic";
export const revalidate = 0; // extra safety
export const runtime = "nodejs";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  // Be lenient: DB numerics can arrive as strings in some drivers
  amount_cents: z.coerce.number().nullable().optional(),
  total_amount: z.coerce.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
type InvoiceRow = z.infer<typeof Invoice>;

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, amount_cents, total_amount, currency, description"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) notFound();

  const parsed = Invoice.safeParse(data);
  if (!parsed.success) notFound();
  const invoice: InvoiceRow = parsed.data;

  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  const invoiceUrl = `/api/tenant/invoices/${invoice.id}/pdf`;
  const receiptUrl = `/api/tenant/invoices/${invoice.id}/receipt`;

  const total =
    typeof invoice.total_amount === "number"
      ? invoice.total_amount
      : typeof invoice.amount_cents === "number"
      ? invoice.amount_cents / 100
      : 0;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Link href="/tenant/invoices" className="text-sm text-blue-600 hover:underline">
        ← Back to invoices
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">
          Invoice {invoice.number ?? `#${invoice.id.slice(0, 6)}`}
        </h1>
        <p className="text-sm text-gray-500">
          {invoice.description ?? "—"} · {String(invoice.status ?? "").toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <a href={invoiceUrl} className="px-4 py-2 rounded bg-gray-900 text-white text-sm">
          Download invoice (PDF)
        </a>
        <a
          href={receiptUrl}
          className={`px-4 py-2 rounded text-sm ${
            isPaid
              ? "bg-gray-900 text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          aria-disabled={!isPaid}
          onClick={(e) => {
            if (!isPaid) e.preventDefault();
          }}
        >
          Download receipt (PDF)
        </a>
      </div>

      <div className="text-sm text-gray-700">
        <div>
          Total: {total} {invoice.currency ?? "PKR"}
        </div>
        <div>
          Issued: {invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"}
        </div>
        <div>
          Due: {invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}
        </div>
      </div>
    </div>
  );
}
