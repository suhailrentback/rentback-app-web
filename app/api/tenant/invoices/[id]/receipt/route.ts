// app/api/tenant/invoices/[id]/receipt/route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createRouteSupabase } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  total_amount: z
    .preprocess((val) => (typeof val === "string" ? parseFloat(val) : val), z.number())
    .nullable()
    .optional(),
  currency: z.string().nullable().optional(),
});

type InvoiceRow = z.infer<typeof Invoice>;

// Helpers
function safeCurrency(amount: number | null | undefined, currency: string | null | undefined) {
  const a = typeof amount === "number" ? amount : 0;
  const c = (currency || "PKR").toUpperCase();
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: c }).format(a);
  } catch {
    return `${a.toFixed(2)} ${c}`;
  }
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
}

function drawHeader(doc: PDFDocument, title: string) {
  const { width } = doc.page;
  doc.save();
  doc.rect(0, 0, width, 64).fill("#111827");
  doc.fill("#FFFFFF").fontSize(16).text("RentBack", 48, 22);
  doc.fontSize(10).fill("#C7D2FE").text(title, 140, 26);
  doc.restore();
}

function drawFooter(doc: PDFDocument) {
  const footer = () => {
    const { width, height } = doc.page;
    doc.save();
    doc.fontSize(9).fillColor("#6B7280");
    doc.text(
      `Generated on ${new Date().toLocaleString("en-GB")}`,
      48,
      height - 40,
      { width: width - 96, align: "left" }
    );
    doc.text(
      `Page ${doc.page.number}`,
      48,
      height - 40,
      { width: width - 96, align: "right" }
    );
    doc.restore();
  };
  footer();
  doc.on("pageAdded", footer);
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
      "id, number, status, description, issued_at, due_date, total_amount, currency"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Invoice not found" },
      { status: 404 }
    );
  }

  let invoice: InvoiceRow;
  try {
    invoice = Invoice.parse(data);
  } catch {
    return NextResponse.json({ error: "Invoice shape unexpected" }, { status: 500 });
  }

  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  if (!isPaid) {
    return NextResponse.json(
      { error: "Receipt is only available for PAID invoices" },
      { status: 409 }
    );
  }

  // Build PDF
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done: Promise<Buffer> = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  drawHeader(doc, "Payment Receipt");
  drawFooter(doc);

  doc.moveDown(3);
  doc.fontSize(20).fillColor("#111827").text("Payment Receipt");
  doc.moveDown(0.75);
  if (invoice.description) {
    doc.fontSize(11).fillColor("#374151").text(invoice.description);
  }

  // Meta
  doc.moveDown(1.25);
  doc.fontSize(11).fillColor("#111827");
  doc.text(`Invoice: ${invoice.number ?? invoice.id}`);
  doc.text(`Status: ${(invoice.status ?? "").toUpperCase() || "—"}`);
  doc.text(`Issued: ${fmtDate(invoice.issued_at)}`);
  doc.text(`Due: ${fmtDate(invoice.due_date)}`);

  // Amount
  doc.moveDown(1);
  doc.fontSize(14).fillColor("#111827").text("Amount Received");
  doc.fontSize(20).fillColor("#111827").text(
    safeCurrency(invoice.total_amount ?? 0, invoice.currency ?? "PKR")
  );

  doc.moveDown(2);
  doc.fontSize(10).fillColor("#6B7280").text(
    "This receipt confirms that payment has been received in full for the invoice referenced above."
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
      "Content-Disposition": `inline; filename="receipt-${invoice.number ?? invoice.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
