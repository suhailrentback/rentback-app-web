// app/admin/api/payments/confirm/route.ts
// Confirms a payment, updates invoice->paid, inserts receipt, and emails tenant.
// Node runtime to allow pdfkit & Buffer usage.

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import PDFDocument from "pdfkit";
import { sendEmail } from "@/lib/mailer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSb() {
  const jar = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });
}

async function requireStaffOrAdmin() {
  const sb = getSb();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401 as const, sb };

  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["staff", "admin"].includes(String(me.role))) {
    return { ok: false as const, status: 403 as const, sb };
  }
  return { ok: true as const, sb, uid };
}

async function getFormOrJsonId(req: Request): Promise<string | null> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const id = form.get("paymentId");
    return typeof id === "string" && id ? id : null;
  }
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => null);
    const id = j?.paymentId || j?.id;
    return typeof id === "string" && id ? id : null;
  }
  // also allow query param as a fallback
  const url = new URL(req.url);
  const qp = url.searchParams.get("paymentId") || url.searchParams.get("id");
  return typeof qp === "string" && qp ? qp : null;
}

function first<T = any>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return (v[0] ?? null) as T | null;
  return (v ?? null) as T | null;
}

function formatMoney(amountCents: number, currency: string) {
  const amt = (Number(amountCents || 0) / 100).toFixed(2);
  return `${amt} ${currency}`;
}

async function buildReceiptPdf(opts: {
  tenantName: string;
  tenantEmail: string;
  invoiceNumber: string;
  paymentRef: string;
  amountCents: number;
  currency: string;
  paidAtISO: string;
}) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("RentBack — Payment Receipt", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#555").text(`Issued: ${new Date().toISOString().slice(0, 10)}`);
    doc.moveDown();

    doc.fillColor("#000").fontSize(12).text(`Billed To: ${opts.tenantName || opts.tenantEmail}`);
    doc.text(`Email: ${opts.tenantEmail}`);
    doc.moveDown();

    doc.text(`Invoice: ${opts.invoiceNumber}`);
    doc.text(`Payment Reference: ${opts.paymentRef}`);
    doc.text(`Paid At: ${opts.paidAtISO}`);
    doc.text(`Amount: ${formatMoney(opts.amountCents, opts.currency)}`);
    doc.moveDown();

    doc.fontSize(10).fillColor("#666").text("Thank you for your payment.");
    doc.end();
  });
}

export async function POST(req: Request) {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "unauthorized" : "forbidden" },
      { status: guard.status }
    );
  }
  const { sb } = guard;

  const paymentId = await getFormOrJsonId(req);
  if (!paymentId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // 1) Load payment + invoice (joined). Supabase may shape the join as an array.
  const { data: payment, error: payErr } = await sb
    .from("payments")
    .select(
      "id, amount_cents, currency, status, reference, created_at, invoice_id, confirmed_at, invoice:invoices(id, number, tenant_id)"
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (payErr) {
    return NextResponse.json({ error: "load_payment_failed", detail: payErr.message }, { status: 500 });
  }
  if (!payment) {
    return NextResponse.json({ error: "payment_not_found" }, { status: 404 });
  }

  const invoiceJoined = first<any>(payment.invoice);
  if (!invoiceJoined || !invoiceJoined.id) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 400 });
  }

  const invoiceId: string = String(invoiceJoined.id);
  const nowIso = new Date().toISOString();

  // 2) Confirm payment (idempotent-ish) and mark invoice paid
  if (payment.status !== "confirmed") {
    const { error: upPayErr } = await sb
      .from("payments")
      .update({ status: "confirmed", confirmed_at: nowIso })
      .eq("id", payment.id);
    if (upPayErr) {
      return NextResponse.json({ error: "update_payment_failed", detail: upPayErr.message }, { status: 500 });
    }
  }

  const { error: upInvErr } = await sb.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
  if (upInvErr) {
    return NextResponse.json({ error: "update_invoice_failed", detail: upInvErr.message }, { status: 500 });
  }

  // 3) Insert receipt (ignore duplicate)
  const { error: rcptErr } = await sb.from("receipts").insert({
    payment_id: payment.id,
    invoice_id: invoiceId,
    amount_cents: payment.amount_cents,
    currency: payment.currency,
    issued_at: nowIso,
  });
  if (rcptErr && rcptErr.code !== "23505") {
    return NextResponse.json({ error: "insert_receipt_failed", detail: rcptErr.message }, { status: 500 });
  }

  // 4) Email tenant (no-op if RESEND_API_KEY not set)
  let tenantEmail = "";
  let tenantName = "";
  if (invoiceJoined.tenant_id) {
    const { data: tenantProf } = await sb
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", invoiceJoined.tenant_id)
      .maybeSingle();
    tenantEmail = tenantProf?.email || "";
    tenantName = tenantProf?.full_name || "";
  }

  const baseUrl = process.env.SITE_URL || "https://www.rentback.app";
  const invoiceLink = `${baseUrl}/tenant/invoices/${invoiceId}`;
  const receiptLink = `${baseUrl}/api/tenant/invoices/${invoiceId}/receipt`;

  if (tenantEmail) {
    const subject = `Receipt: ${String(invoiceJoined.number || "")} — ${formatMoney(payment.amount_cents, payment.currency)}`;
    const html = `
      <p>Hi ${tenantName || "there"},</p>
      <p>Your payment <strong>${formatMoney(payment.amount_cents, payment.currency)}</strong> for invoice <strong>${String(
        invoiceJoined.number || ""
      )}</strong> has been confirmed.</p>
      <p>You can view your documents here:</p>
      <ul>
        <li>Invoice: <a href="${invoiceLink}">${invoiceLink}</a></li>
        <li>Receipt (PDF): <a href="${receiptLink}">${receiptLink}</a></li>
      </ul>
      <p>Thank you,<br/>RentBack</p>
    `.trim();

    // Optional PDF attachment; if it fails, send without attachment
    let attachments: { filename: string; content: string }[] | undefined = undefined;
    try {
      const pdfBuf = await buildReceiptPdf({
        tenantName,
        tenantEmail,
        invoiceNumber: String(invoiceJoined.number || ""),
        paymentRef: String(payment.reference || payment.id),
        amountCents: Number(payment.amount_cents || 0),
        currency: String(payment.currency || ""),
        paidAtISO: nowIso,
      });
      attachments = [
        {
          filename: `receipt-${String(invoiceJoined.number || invoiceId)}.pdf`,
          content: pdfBuf.toString("base64"),
        },
      ];
    } catch {
      // swallow
    }

    await sendEmail({
      to: tenantEmail,
      subject,
      html,
      attachments,
    });
  }

  // 5) Redirect back to Admin /payments (PRG pattern)
  return NextResponse.redirect(new URL("/admin/payments", baseUrl), 303);
}
