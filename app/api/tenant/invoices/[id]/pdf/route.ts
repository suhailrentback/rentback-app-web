import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Shape we expect from the DB
type InvoiceRow = {
  id: string;
  number?: string | null;
  status?: string | null;
  issued_at?: string | null;
  due_date?: string | null;
  total_amount?: number | null;
  currency?: string | null;
};

// Tiny type guard so TS stops treating data as GenericStringError
function isInvoiceRow(x: unknown): x is InvoiceRow {
  return !!x && typeof x === "object" && "id" in (x as Record<string, unknown>);
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();
  const { id } = params;

  // Fetch row; don't access any fields until we narrow the type
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, currency"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !isInvoiceRow(data)) {
    return NextResponse.json(
      { error: error?.message ?? "Invoice not found" },
      { status: 404 }
    );
  }

  // Now it's safe to read fields
  const invoice = data as InvoiceRow;

  // Only allow receipts for PAID invoices
  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  if (!isPaid) {
    return NextResponse.json(
      { error: "Receipt is only available for PAID invoices" },
      { status: 409 }
    );
    // 409 so UI can show a nice message without treating it as "not found"
  }

  // ---- Build a simple receipt PDF (in-memory) ----
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const finalized: Promise<Buffer> = new Promise((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  doc.fontSize(18).text("Payment Receipt");
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor("#111827");
  doc.text(`Invoice #${invoice.number ?? invoice.id}`);
  doc.text(`Status: ${(invoice.status ?? "").toUpperCase()}`);
  doc.text(
    `Issued: ${
      invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"
    }`
  );
  doc.text(
    `Due: ${invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}`
  );
  doc.moveDown();

  const amount =
    typeof invoice.total_amount === "number" ? invoice.total_amount : 0;
  const currency = invoice.currency ?? "PKR";
  doc.fontSize(12).fillColor("#111827").text(`Amount Received: ${amount} ${currency}`);

  doc.end();

  const pdfBuffer = await finalized;

  // Convert Buffer -> ArrayBuffer (BodyInit-friendly for NextResponse)
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  ) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${
        invoice.number ?? invoice.id
      }.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
