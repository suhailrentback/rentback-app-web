import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createRouteSupabase } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

// DB row shape we select (raw)
type DbInvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  issued_at: string | null;
  due_date: string | null;
  amount_cents: number | null;
  total_amount: number | null;
  currency: string | null;
};

// Runtime guard (handles numbers that might come back as strings)
const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  amount_cents: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number()).nullable().optional(),
  total_amount: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number()).nullable().optional(),
  currency: z.string().nullable().optional(),
});
type InvoiceRow = z.infer<typeof Invoice>;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();
  const { id } = params;

  // ✅ Strong type on the query so we never see GenericStringError
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, issued_at, due_date, amount_cents, total_amount, currency")
    .eq("id", id)
    .returns<DbInvoiceRow>()
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Invoice not found" },
      { status: 404 }
    );
  }

  // Validate & normalize
  let invoice: InvoiceRow;
  try {
    invoice = Invoice.parse(data);
  } catch {
    return NextResponse.json({ error: "Invoice shape unexpected" }, { status: 500 });
  }

  // Only allow receipts for PAID invoices
  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  if (!isPaid) {
    return NextResponse.json(
      { error: "Receipt is only available for PAID invoices" },
      { status: 409 }
    );
  }

  // Build minimal receipt PDF in-memory
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done: Promise<Buffer> = new Promise((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  doc.fontSize(16).text("Payment Receipt");
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#111827");
  doc.text(`Invoice #${invoice.number ?? invoice.id}`);
  doc.text(`Status: ${(invoice.status ?? "").toUpperCase()}`);
  doc.text(`Issued: ${invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"}`);
  doc.text(`Due: ${invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}`);
  const amt = typeof invoice.total_amount === "number" ? invoice.total_amount : (typeof invoice.amount_cents === "number" ? invoice.amount_cents / 100 : 0);
  doc.text(`Amount Received: ${amt} ${invoice.currency ?? "PKR"}`);
  doc.end();

  const pdfBuffer = await done;

  // Return as ArrayBuffer so NextResponse body type is happy in Node runtimes
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  ) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${invoice.number ?? invoice.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
