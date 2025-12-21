import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

type Row = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
  user_id?: string;
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, anon);

  // Fetch invoice (RLS should ensure access control)
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, due_at, total, currency, created_at")
    .eq("id", params.id)
    .limit(1);

  if (error || !data || !data[0]) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const inv = data[0] as Row;

  // Generate a simple PDF receipt
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const draw = (text: string, x: number, y: number, size = 12) => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  };

  let y = 760;
  draw("RECEIPT", 50, y, 20);
  y -= 30;
  draw(`Invoice: ${inv.number ?? inv.id}`, 50, y); y -= 18;
  draw(`Status: ${inv.status}`, 50, y); y -= 18;
  draw(`Created: ${inv.created_at ? new Date(inv.created_at).toLocaleString() : "—"}`, 50, y); y -= 18;
  draw(`Due: ${inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}`, 50, y); y -= 18;
  draw(
    `Total: ${
      typeof inv.total === "number"
        ? `${(inv.currency ?? "USD").toUpperCase()} ${(inv.total / 100).toFixed(2)}`
        : "—"
    }`,
    50,
    y
  );

  const pdfBytes = await pdf.save(); // Uint8Array<ArrayBufferLike>

  // Convert to a real ArrayBuffer to satisfy TS DOM types
  const ab = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;

  const filename = `Receipt-${inv.number ?? inv.id}.pdf`;

  return new NextResponse(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
      "Content-Length": String((ab as ArrayBuffer).byteLength || pdfBytes.byteLength),
    },
  });
}
