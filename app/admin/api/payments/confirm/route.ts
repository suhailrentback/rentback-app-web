// app/admin/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

function isUuid(v: unknown) {
  return typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);
}

async function requireStaff(sb: ReturnType<typeof createRouteSupabase>) {
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id ?? null;
  if (!uid) return null;

  const { data: me } = await sb
    .from("profiles")
    .select("id, role, email")
    .eq("id", uid)
    .maybeSingle();

  if (!me) return null;
  if (!["staff", "admin"].includes(String(me.role))) return null;

  return { uid, role: String(me.role), email: String((me as any).email ?? "") };
}

// Email sender (no-op if keys absent). We just send a link, not an attachment.
async function sendReceiptEmail(opts: {
  to: string;
  tenantName?: string | null;
  invoiceId: string;
  invoiceNumber?: string | null;
  siteUrl: string;
}) {
  const { to, tenantName, invoiceId, invoiceNumber, siteUrl } = opts;
  // If you later wire an email provider, do it here.
  // For now, this is a safe no-op to avoid build errors.
  console.log(
    "[email] Would send receipt link to:",
    to,
    "invoice:",
    invoiceNumber ?? invoiceId
  );
  return { ok: true as const };
}

export async function POST(req: Request) {
  const sb = createRouteSupabase();

  // Staff/auth check
  const staff = await requireStaff(sb);
  if (!staff) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  // Parse form data
  const form = await req.formData();
  const paymentId = form.get("paymentId");
  if (!isUuid(paymentId)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Load payment with its invoice
  const { data: payment, error: payErr } = await sb
    .from("payments")
    .select(
      `
      id, status, amount_cents, currency, tenant_id, invoice_id,
      invoice:invoices!payments_invoice_id_fkey ( id, number, tenant_id, status )
    `
    )
    .eq("id", String(paymentId))
    .maybeSingle();

  if (payErr || !payment) {
    return NextResponse.json({ error: "payment_not_found" }, { status: 404 });
  }
  if (String(payment.status) !== "submitted") {
    // Idempotent-ish: treat already confirmed as success
    const url = new URL("/admin/payments?ok=1", req.url);
    return NextResponse.redirect(url, 303);
  }
  if (!payment.invoice || !payment.invoice.id) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 400 });
  }

  // 1) Confirm payment
  const { error: updPayErr } = await sb
    .from("payments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", String(paymentId));

  if (updPayErr) {
    return NextResponse.json({ error: "update_payment_failed" }, { status: 500 });
  }

  // 2) Mark invoice PAID (only if not already)
  const { error: updInvErr } = await sb
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", payment.invoice.id);

  if (updInvErr) {
    return NextResponse.json({ error: "update_invoice_failed" }, { status: 500 });
  }

  // 3) Insert receipt row
  // Receipts table columns assumed: id (uuid default), invoice_id, payment_id,
  // tenant_id, amount_cents, currency, created_at default now()
  const { error: insRecErr } = await sb.from("receipts").insert({
    invoice_id: payment.invoice.id,
    payment_id: String(paymentId),
    tenant_id: payment.tenant_id ?? payment.invoice.tenant_id ?? null,
    amount_cents:
      typeof payment.amount_cents === "number"
        ? payment.amount_cents
        : Number(payment.amount_cents ?? 0),
    currency: payment.currency ?? "PKR",
  });

  if (insRecErr) {
    return NextResponse.json({ error: "insert_receipt_failed" }, { status: 500 });
  }

  // 4) (Best-effort) Email the tenant a link to their receipt
  // Find tenant email from profiles
  let tenantEmail: string | null = null;
  const tenantId = payment.tenant_id ?? payment.invoice.tenant_id ?? null;
  if (tenantId) {
    const { data: tenant } = await sb
      .from("profiles")
      .select("email, full_name")
      .eq("id", tenantId)
      .maybeSingle();

    tenantEmail = (tenant?.email as string) ?? null;

    const siteUrl = process.env.SITE_URL || "https://www.rentback.app";
    if (tenantEmail) {
      await sendReceiptEmail({
        to: tenantEmail,
        tenantName: (tenant?.full_name as string) ?? null,
        invoiceId: payment.invoice.id,
        invoiceNumber: payment.invoice.number ?? null,
        siteUrl,
      });
    }
  }

  // Redirect back to the admin payments queue
  const url = new URL("/admin/payments?ok=1", req.url);
  return NextResponse.redirect(url, 303);
}
