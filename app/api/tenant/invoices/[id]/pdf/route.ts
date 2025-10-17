import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type InvoiceRow = {
  id: string;
  number?: string | null;
  status?: string | null;
  issued_at?: string | null;
  due_date?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  // If you later add paid_at in your schema, you can include it here:
  // paid_at?: string | null;
};

function isInvoiceRow(x: unknown): x is InvoiceRow {
  return !!x && typeof x === "object" && "id" in (x as Record<string, unknown>);
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();
  const { id } = params;

  // Fetch the invoice row
  const { data, error } = await supabase
    .from("invoices")
    .select(
      [
        "id",
        "number",
        "status",
        "issued_at",
        "due_date",
        "total_amount",
        "currency",
        // "paid_at", // uncomment if/when this column exists
      ].join(",")
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !isInvoiceRow(data)) {
    return NextResponse.json(
      { error: error?.message ?? "Invoice not found" },
      { status: 404 }
    );
  }

  const invoice = data;

  // Must be paid to have a receipt
  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  if (!isPaid) {
    return NextResponse.json(
      { error: "Receipt is only available for PAID invoices" },
      { status: 409 }
    );
  }

  // Build a simple PDF receipt
  const doc = new PDFDocument({ size: "A4", margin: 48 });

  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const finalized: Promise<Buffer> = new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header
  doc.fontSize(18).text("Payment Receipt");
  doc.moveDown(0.5);

  // Meta
  doc.fontSize(10).fillColor("#111827");
  doc.text(`Invoice #${invoice.number ?? invoice.id}`);
  doc.text(`Status: ${(invoice.status ?? "").toUpperCase()}`);
  // doc.text(`Paid: ${invoice.paid_at ? new Date(invoice.paid_at).toDateString() : "—"}`); // if you add paid_at
  doc.moveDown();

  // Amount
  const amount =
    typeof invoice.total_amount === "number" ? invoice.total_amount : 0;
  const currency = invoice.currency ?? "PKR";
  doc.fontSize(12).fillColor("#111827").text(`Amount Received: ${amount} ${currency}`);

  doc.moveDown();
  doc
    .fontSize(10)
    .fillColor("#374151")
    .text(
      "This receipt acknowledges full payment for the invoice listed above.",
      { width: 480 }
    );

  // Finalize and return as ArrayBuffer (BodyInit-safe)
  doc.end();
  const pdfBuffer = await finalized;
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
