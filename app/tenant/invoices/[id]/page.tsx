// app/tenant/invoices/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  total_amount: z.preprocess((val) => {
    if (val == null) return null;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const n = Number(val.trim());
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  }, z.number()).nullable().optional(),
  currency: z.string().nullable().optional(),
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
      "id, number, status, issued_at, due_date, total_amount, currency"
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

  const fmtDate = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString() : "—";
  const fmtAmount = (n?: number | null, c?: string | null) => {
    const amt = typeof n === "number" ? n : 0;
    return `${amt.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${c ?? "PKR"}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Invoice #{invoice.number ?? invoice.id}
        </h1>
        <p className="text-sm text-gray-500">
          Status: {(invoice.status ?? "").toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <div className="text-gray-500">Issued</div>
          <div>{fmtDate(invoice.issued_at)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-500">Due</div>
          <div>{fmtDate(invoice.due_date)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-gray-500">Total</div>
          <div>{fmtAmount(invoice.total_amount, invoice.currency)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          className="px-4 py-2 rounded-xl border hover:bg-gray-50"
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View PDF
        </a>

        <a
          className={`px-4 py-2 rounded-xl border hover:bg-gray-50 ${
            !isPaid ? "pointer-events-none opacity-50" : ""
          }`}
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!isPaid}
          title={isPaid ? "Open receipt" : "Receipt available once paid"}
        >
          View Receipt
        </a>

        <Link
          className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          href="/tenant/invoices"
        >
          Back to invoices
        </Link>
      </div>
    </div>
  );
}
