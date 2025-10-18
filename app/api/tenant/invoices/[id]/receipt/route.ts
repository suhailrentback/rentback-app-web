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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();
  const { id } = params;

  // ✅ No generics; validate with Zod to avoid GenericStringError typing
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, issued_at, due_date, total_amount, currency")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Invoice not found" },
      { status: 404 }
    );
  }

  const parsed = Invoice.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invoice shape unexpected" }, { status: 500 });
  }
  const invoice: InvoiceRow = parsed.data;

  // Only allow receipts for PAID invoices
  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  if (!isPaid) {
    return NextResponse.json(
      { error: "Receipt is only available for PAID invoices" },
      { status: 409 }
    );
    }

  // ---- Build a simple receipt PDF (in-memory) ----
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done: Promise<Buffer> = new Promise((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  doc.fontSize(18).text("Payment Receipt", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#111827");
  doc.text(`Invoice #${invoice.number ?? invoice.id}`);
  doc.text(`Status: ${(invoice.status ?? "").toUpperCase()}`);
  doc.text(`Issued: ${invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"}`);
  doc.text(`Due: ${invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}`);
  const amt = typeof invoice.total_amount === "number" ? invoice.total_amount : 0;
  doc.text(`Amount Received: ${amt} ${invoice.currency ?? "PKR"}`);
  doc.end();

  const pdfBuffer = await done;

  // Return as ArrayBuffer so NextResponse BodyInit is satisfied
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
