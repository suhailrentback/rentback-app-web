// app/api/tenant/invoices/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createRouteSupabase } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  total_amount: z
    .preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number())
    .nullable()
    .optional(),
  amount_cents: z
    .preprocess((v) => (typeof v === "string" ? parseInt(v) : v), z.number())
    .nullable()
    .optional(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

type InvoiceRow = z.infer<typeof Invoice>;

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteSupabase();
  const { id } = params;

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, amount_cents, currency, description"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Invoice not found" }, { status: 404 });
  }

  let invoice: InvoiceRow;
  try {
    invoice = Invoice.parse(data);
  } catch (e) {
    console.error("Invoice zod parse failed:", e);
    return NextResponse.json({ error: "Invoice shape unexpected" }, { status: 500 });
  }

  const currency = invoice.currency ?? "PKR";
  const gross =
    typeof invoice.total_amount === "number"
      ? invoice.total_amount
      : typeof invoice.amount_cents === "number"
      ? invoice.amount_cents / 100
      : 0;

  // ---- PDF (with branding header/footer) ----
  const doc = new PDFDocument({ size: "A4", margin: 54 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done: Promise<Buffer> = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // Header
  doc.fillColor("#111827").fontSize(18).text("RentBack", { continued: false });
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor("#6B7280").text("Invoice", { continued: false });
  doc.moveTo(54, 90).lineTo(541, 90).strokeColor("#E5E7EB").stroke();
  doc.moveDown();

  // Body
  doc.fillColor("#111827").fontSize(14).text(`Invoice ${invoice.number ?? invoice.id}`);
  if (invoice.description) {
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor("#374151").text(invoice.description);
  }

  doc.moveDown();
  doc.fontSize(10).fillColor("#111827");
  doc.text(`Status: ${(invoice.status ?? "").toUpperCase()}`);
  doc.text(`Issued: ${fmtDate(invoice.issued_at)}`);
  doc.text(`Due: ${fmtDate(invoice.due_date)}`);
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#111827").text(`Total: ${money(gross, currency)}`);

  // Footer
  const bottom = doc.page.height - 54;
  doc.moveTo(54, bottom - 16).lineTo(541, bottom - 16).strokeColor("#E5E7EB").stroke();
  doc.fontSize(8).fillColor("#6B7280").text(
    `Generated on ${fmtDate(new Date().toISOString())}`,
    54,
    bottom - 12,
    { width: 487, align: "right" }
  );

  doc.end();
  const pdfBuffer = await done;

  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  ) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.number ?? invoice.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
