// app/landlord/invoices/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  tenant_id: z.string(),
});
type Invoice = z.infer<typeof Invoice>;

export default async function LandlordInvoiceDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, description, status, issued_at, due_date, total_amount, currency, tenant_id"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) notFound();

  const parsed = Invoice.safeParse(data);
  if (!parsed.success) notFound();

  const invoice = parsed.data;

  const title = `Invoice ${invoice.number ?? invoice.id}`;
  const status = (invoice.status ?? "").toUpperCase();
  const issued = invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—";
  const due = invoice.due_date ? new Date(invoice.due_date).toDateString() : "—";
  const total =
    typeof invoice.total_amount === "number"
      ? `${invoice.total_amount} ${invoice.currency ?? ""}`.trim()
      : "—";

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <Link href="/landlord/invoices" className="text-sm text-blue-600 hover:underline">
        ← Back to invoices
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-gray-600">
          {(invoice.description ?? "").trim() || "No description"}
        </p>
        <p className="text-xs text-gray-500">Status: {status}</p>
      </div>

      <div className="rounded-lg border divide-y">
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total</span>
          <span className="font-medium">{total}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Issued</span>
          <span className="font-medium">{issued}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Due</span>
          <span className="font-medium">{due}</span>
        </div>
      </div>

      <div>
        <Link href="/landlord" className="text-sm text-blue-600 hover:underline">
          Back to landlord home
        </Link>
      </div>
    </main>
  );
}
