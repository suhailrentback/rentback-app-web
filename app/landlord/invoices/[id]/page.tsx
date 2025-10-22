// app/landlord/invoices/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

export default async function LandlordInvoiceDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();
  const { id } = params;

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, description, total_amount, currency, issued_at, due_date"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const inv = Invoice.parse(data);
  const isPaid = String(inv.status ?? "").toLowerCase() === "paid";

  // Reuse existing PDF/receipt routes (tenant endpoints generate PDFs server-side)
  const invoiceUrl = `/api/tenant/invoices/${inv.id}/pdf`;
  const receiptUrl = `/api/tenant/invoices/${inv.id}/receipt`;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <Link href="/landlord/invoices" className="text-sm text-blue-600 hover:underline">
        ← Back to invoices
      </Link>

      <h1 className="text-xl font-semibold">
        Invoice {inv.number ?? inv.id.slice(0, 8)}
      </h1>
      <p className="text-sm text-gray-600">
        {(inv.description ?? "").trim() || "—"} ·{" "}
        {(inv.status ?? "").toUpperCase() || "UNKNOWN"}
      </p>

      <div className="flex flex-wrap gap-3">
        <a
          href={invoiceUrl}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Download invoice (PDF)
        </a>
        {isPaid && (
          <a
            href={receiptUrl}
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Download receipt (PDF)
          </a>
        )}
      </div>

      <div className="rounded-lg border p-6 text-sm grid gap-2">
        <div>
          <span className="text-gray-500">Total: </span>
          {typeof inv.total_amount === "number"
            ? `${inv.total_amount} ${inv.currency ?? "PKR"}`
            : "—"}
        </div>
        <div>
          <span className="text-gray-500">Issued: </span>
          {inv.issued_at ? new Date(inv.issued_at).toDateString() : "—"}
        </div>
        <div>
          <span className="text-gray-500">Due: </span>
          {inv.due_date ? new Date(inv.due_date).toDateString() : "—"}
        </div>
      </div>
    </main>
  );
}
