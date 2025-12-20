// app/api/receipts/[id]/route.ts
// Generates a simple PDF receipt for a PAID invoice (demo-safe).
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

type InvoiceRow = {
  id: string;
  number: string;
  title: string;
  issued_at: string; // ISO
  due_date: string;  // ISO
  total_cents: number;
  currency: string;  // "USD" | "PKR" | ...
  status: InvoiceStatus;
  landlord_name?: string | null;
};

type InvoiceItem = {
  id: string;
  description: string;
  qty: number;
  unit_cents: number;
  total_cents: number;
};

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const demo = (process.env.NEXT_PUBLIC_DEMO ?? "true").toLowerCase() !== "false";

  // Demo data lookup (kept local to avoid cross-file imports).
  const inv = demo ? demoInvoices().find((r) => r.id === id) ?? null : null;
  if (!inv) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (inv.status !== "PAID") {
    return NextResponse.json({ error: "Receipt available only for PAID invoices" }, { status: 400 });
  }

  const items = demoItemsFor(inv);
  const pdfBytes = await buildReceiptPdf(inv, items);

  const filename = `Receipt-${inv.number}.pdf`;
  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** ----------- PDF builder ----------- */
async function buildReceiptPdf(inv: InvoiceRow, items: InvoiceItem[]) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text: string, x: number, y: number, size = 12, f = font) => {
    page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) });
  };

  let y = 750;
  drawText("RentBack Receipt", 50, y, 20, bold); y -= 24;
  drawText(inv.number, 50, y, 12); y -= 18;

  drawText(`Title: ${inv.title}`, 50, y); y -= 16;
  drawText(`Issued: ${fmtDate(inv.issued_at)}`, 50, y); y -= 16;
  drawText(`Due: ${fmtDate(inv.due_date)}`, 50, y); y -= 22;
  drawText(`Landlord: ${inv.landlord_name ?? "—"}`, 50, y); y -= 28;

  // Table headers
  drawText("Description", 50, y, 12, bold);
  drawText("Qty", 340, y, 12, bold);
  drawText("Unit", 390, y, 12, bold);
  drawText("Amount", 470, y, 12, bold);
  y -= 14;
  page.drawLine({ start: { x: 50, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.8,0.8,0.8) });
  y -= 10;

  let subtotal = 0;
  for (const it of items) {
    drawText(it.description, 50, y);
    drawText(String(it.qty), 340, y);
    drawText(fmtMoney(it.unit_cents, inv.currency), 390, y);
    drawText(fmtMoney(it.total_cents, inv.currency), 470, y);
    subtotal += it.total_cents;
    y -= 16;
  }

  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.8,0.8,0.8) });
  y -= 16;

  drawText("Subtotal:", 390, y);
  drawText(fmtMoney(subtotal, inv.currency), 470, y); y -= 16;

  const tax = 0;
  drawText("Tax:", 390, y);
  drawText(fmtMoney(tax, inv.currency), 470, y); y -= 16;

  drawText("Total:", 390, y, 12, bold);
  drawText(fmtMoney(inv.total_cents, inv.currency), 470, y, 12, bold); y -= 24;

  drawText("Status: PAID", 50, y, 12, bold);

  return await doc.save();
}

/** ----------- Demo data (must match the list/detail pages) ----------- */
function demoInvoices(): InvoiceRow[] {
  const now = Date.now();
  const days = (n: number) => new Date(now + n * 24 * 3600 * 1000).toISOString();
  const base = (i: number, status: InvoiceStatus, dIssue: number, dDue: number): InvoiceRow => ({
    id: `inv_${i}`,
    number: `RB-${2025}-${String(i).padStart(4, "0")}`,
    title: `Monthly Rent #${i}`,
    issued_at: days(dIssue),
    due_date: days(dDue),
    total_cents: 85000 * 100,
    currency: "PKR",
    status,
    landlord_name: "ABC Properties",
  });
  const arr: InvoiceRow[] = [];
  arr.push(base(1, "PAID", -60, -45));
  arr.push(base(2, "PAID", -30, -15));
  arr.push(base(3, "ISSUED", -5, +10));
  arr.push(base(4, "OVERDUE", -40, -5));
  arr.push(base(5, "DRAFT", 0, +15));
  for (let i = 6; i <= 26; i++) {
    const mod = i % 4;
    const st: InvoiceStatus = mod === 0 ? "PAID" : mod === 1 ? "ISSUED" : mod === 2 ? "OVERDUE" : "DRAFT";
    arr.push(base(i, st, -i, 10 - (i % 20)));
  }
  return arr;
}

function demoItemsFor(inv: InvoiceRow): InvoiceItem[] {
  const rent = 80000 * 100;
  const maintenance = 5000 * 100;
  const sum = rent + maintenance;
  const diff = Math.max(0, inv.total_cents - sum);
  const items: InvoiceItem[] = [
    { id: `${inv.id}_1`, description: "Monthly Rent", qty: 1, unit_cents: rent, total_cents: rent },
    { id: `${inv.id}_2`, description: "Maintenance / Services", qty: 1, unit_cents: maintenance, total_cents: maintenance },
  ];
  if (diff > 0) {
    items.push({ id: `${inv.id}_3`, description: "Adjustments", qty: 1, unit_cents: diff, total_cents: diff });
  }
  return items;
}

/** ----------- utils ----------- */
function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
function fmtMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
