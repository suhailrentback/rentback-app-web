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
  if (!["staff", "admin"].includes(String((me as any).role))) return null;

  return { uid, role: String((me as any).role), email: String((me as any).email ?? "") };
}

// Optional email sender — no-op to keep zero-deps & zero-risk
async function sendReceiptEmail(opts: {
  to: string;
  tenantName?: string | null;
  invoiceId: string;
  invoiceNumber?: string | null;
  siteUrl: string;
}) {
  const { to, tenantName, invoiceId, invoiceNumber, siteUrl } = opts;
  console.log("[email] Would send receipt link →", {
    to,
    tenantName,
    invoiceId,
    invoiceNumber,
    siteUrl,
  });
  return { ok: true as const };
}

type InvoiceEmbed =
  | { id: string; number: string | null; tenant_id: string | null; status: string | null }
  | null;

type PaymentRow = {
  id: string;
  status: string;
  amount_cents: number | null;
  currency: string | null;
  tenant_id: string | null;
  invoice_id: string | null;
  // Supabase may return embedded relations as an array; normalize later
  invoice?: InvoiceEmbed | InvoiceEmbed[] | null;
};

function firstInvoice(inv: PaymentRow["invoice"]): InvoiceEmbed {
  if (!inv) return null;
  if (Array.isArray(inv)) return inv.length ? inv[0] ?? null : null;
  return inv;
}

export async function POST(req: Request) {
  const sb = createRouteSupabase();

  // Staff/auth check
  const staff = await requireStaff(sb);
  if (!staff) {
    return NextResponse.json({ error: "not_permitted" }, { status: 403 });
  }

  // Parse form data
  const form = await req.formData();
  const paymentId = form.get("paymentId");
  if (!isUuid(paymentId)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Load payment with its invoice (embedded)
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

  if (String((payment as PaymentRow).status) !== "submitted") {
    // idempotent-ish: if already confirmed, just bounce back as OK
    const url = new URL("/admin/payments?ok=1", req.url);
    return NextResponse.redirect(url, 303);
  }

  const inv = firstInvoice((payment as PaymentRow).invoice);
  if (!inv || !inv.id) {
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

  // 2) Mark invoice PAID
  const { error: updInvErr } = await sb.from("invoices").update({ status: "paid" }).eq("id", inv.id);
  if (updInvErr) {
    return NextResponse.json({ error: "update_invoice_failed" }, { status: 500 });
  }

  // 3) Insert receipt row
  const p = payment as PaymentRow;
  const amount =
    typeof p.amount_cents === "number" ? p.amount_cents : Number(p.amount_cents ?? 0);
  const currency = p.currency ?? "PKR";

  const { error: insRecErr } = await sb.from("receipts").insert({
    invoice_id: inv.id,
    payment_id: String(paymentId),
    tenant_id: p.tenant_id ?? inv.tenant_id ?? null,
    amount_cents: amount,
    currency,
  });

  if (insRecErr) {
    return NextResponse.json({ error: "insert_receipt_failed" }, { status: 500 });
  }

  // 4) Best-effort email with links
  const siteUrl = process.env.SITE_URL || "https://www.rentback.app";
  if (p.tenant_id) {
    const { data: tenant } = await sb
      .from("profiles")
      .select("email, full_name")
      .eq("id", p.tenant_id)
      .maybeSingle();

    const to = (tenant?.email as string) ?? null;
    if (to) {
      await sendReceiptEmail({
        to,
        tenantName: (tenant?.full_name as string) ?? null,
        invoiceId: inv.id,
        invoiceNumber: inv.number ?? null,
        siteUrl,
      });
    }
  }

  const url = new URL("/admin/payments?ok=1", req.url);
  return NextResponse.redirect(url, 303);
}
