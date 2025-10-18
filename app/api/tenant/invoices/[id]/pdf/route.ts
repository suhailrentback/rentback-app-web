import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  amount_cents: z.coerce.number().nullable().optional(),
  total_amount: z.coerce.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
type InvoiceRow = z.infer<typeof Invoice>;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, amount_cents, total_amount, currency, description"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Invoice not found" },
      { status: 404 }
    );
  }

  const parsed = Invoice.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice shape" }, { status: 500 });
  }
  const invoice: InvoiceRow = parsed.data;

  // Build PDF with pdf-lib (no Node streams needed)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const left = 50;
  const line = (text: string, bold = false, size = 12) => {
    page.drawText(text, {
      x: left,
      y,
      size,
      font: bold ? fontBold : font,
    });
    y -= size + 8;
  };

  const total =
    typeof invoice.total_amount === "number"
      ? invoice.total_amount
      : typeof invoice.amount_cents === "number"
      ? invoice.amount_cents / 100
      : 0;

  line("Invoice", true, 18);
  line("");
  line(`Invoice #${invoice.number ?? invoice.id}`, true);
  line(`Status: ${String(invoice.status ?? "").toUpperCase()}`);
  line(
    `Issued: ${invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"}`
  );
  line(
    `Due: ${invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}`
  );
  line(
    `Total: ${total} ${invoice.currency ?? "PKR"}`
  );
  if (invoice.description) line(`Description: ${invoice.description}`);

  const bytes = await pdfDoc.save();
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  return new NextResponse(body as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.number ?? invoice.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
