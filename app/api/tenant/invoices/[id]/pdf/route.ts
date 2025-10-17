// app/api/tenant/invoices/[id]/pdf/route.ts
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

  // Build PDF into a Buffer
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const finalize = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header
  doc.fontSize(18).text("RentBack Invoice");
  doc.moveDown(0.5);

  // Meta
  doc
    .fontSize(10)
    .fillColor("#111827")
    .text(`Invoice #${invoice.number ?? invoice.id}`);
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

  // Amount
  const amount =
    typeof invoice.total_amount === "number" ? invoice.total_amount : 0;
  const currency = invoice.currency ?? "PKR";
  doc.fontSize(12).fillColor("#111827").text(`Amount: ${amount} ${currency}`);

  doc.end();
  const pdfBuffer = await finalize;

  // ✅ Wrap Buffer in a Blob so BodyInit type matches
  const blob = new Blob([pdfBuffer], { type: "application/pdf" });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${
        invoice.number ?? invoice.id
      }.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
