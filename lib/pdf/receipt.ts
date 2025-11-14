// lib/pdf/receipt.ts
type InvoiceInfo = {
  id: string;
  number: string;
  amount_cents: number;
  currency: string;
  due_date: string | null;
};

type PaymentInfo = {
  id: string;
  amount_cents: number;
  currency: string;
  reference: string | null;
  created_at: string | null;
  confirmed_at: string | null;
};

export async function buildReceiptPDFBuffer(
  invoice: InvoiceInfo,
  payment: PaymentInfo,
  tenantEmail?: string | null
): Promise<Buffer> {
  const { default: PDFDocument } = await import("pdfkit");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // Header
    doc.fontSize(18).text("Payment Receipt", { align: "right" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(new Date().toLocaleString(), { align: "right" });
    doc.moveDown(1);

    // Branding (simple text – no asset changes)
    doc.fontSize(16).text("RentBack", { align: "left" });
    doc.moveDown(1);

    // Receipt meta
    doc.fontSize(12).text(`Invoice: ${invoice.number}`);
    doc.text(`Invoice Due: ${invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}`);
    doc.text(`Tenant: ${tenantEmail || "—"}`);
    doc.moveDown(0.5);

    // Payment section
    const amt = (Number(payment.amount_cents || 0) / 100).toFixed(2);
    doc.fontSize(12).text(`Payment Reference: ${payment.reference || "—"}`);
    doc.text(`Payment Amount: ${amt} ${payment.currency || invoice.currency || ""}`);
    doc.text(`Confirmed At: ${payment.confirmed_at ? new Date(payment.confirmed_at).toLocaleString() : "—"}`);
    doc.moveDown(1);

    // Status
    doc.fontSize(14).fillColor("#15803d").text("PAID", { align: "left" });
    doc.fillColor("#000000");

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor("#6b7280").text("This receipt confirms your payment for the above invoice via RentBack.");
    doc.text("If you have any questions, contact support at help@rentback.app.");
    doc.fillColor("#000000");

    doc.end();
  });
}
