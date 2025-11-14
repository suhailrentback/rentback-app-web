// app/admin/api/payments/confirm/route.ts
export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { buildReceiptPDFBuffer } from "@/lib/pdf/receipt";
import { sendEmailResend } from "@/lib/email";

const URL_APP = process.env.SITE_URL || "https://www.rentback.app";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSb() {
  const jar = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get: (name: string) => jar.get(name)?.value,
      set() {},
      remove() {},
    },
  });
}

async function readPaymentId(req: Request) {
  const ct = req.headers.get("content-type") || "";
  // JSON body
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => null);
    if (j && typeof j.paymentId === "string") return j.paymentId as string;
  }
  // Form body
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    const val = fd?.get("paymentId");
    if (typeof val === "string" && val) return val;
  }
  // Query param fallback
  const url = new URL(req.url);
  const qp = url.searchParams.get("paymentId") || url.searchParams.get("id");
  return typeof qp === "string" && qp ? qp : null;
}

async function guardStaff() {
  const sb = getSb();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return { ok: false as const, reason: "not_signed_in" as const };

  const { data: profile } = await sb
    .from("profiles")
    .select("user_id,role,email")
    .eq("user_id", uid)
    .maybeSingle();

  if (!profile || !["staff", "admin"].includes(String(profile.role || "").toLowerCase())) {
    return { ok: false as const, reason: "not_permitted" as const };
  }
  return { ok: true as const, sb, uid, staffEmail: (profile.email as string) || null };
}

function normalizeOne<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return (x ?? null) as T | null;
}

type PaymentRow = {
  id: string;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  reference: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  tenant_id: string | null;
  // Supabase relation may be object OR array; we keep it as unknown and normalize.
  invoice?: unknown;
};

type InvoiceRel = {
  id: string;
  number: string | number;
  amount_cents?: number | null;
  currency?: string | null;
  due_date?: string | null;
  tenant_id?: string | null;
};

export async function POST(req: Request) {
  // Guard
  const g = await guardStaff();
  if (!g.ok) return NextResponse.json({ error: g.reason }, { status: 403 });
  const sb = g.sb;

  // Input
  const paymentId = await readPaymentId(req);
  if (!paymentId) return NextResponse.json({ error: "missing_payment_id" }, { status: 400 });

  // Load payment + related invoice (be explicit on FK alias; we’ll normalize the shape)
  const { data, error: loadErr } = await sb
    .from("payments")
    .select(
      [
        "id",
        "amount_cents",
        "currency",
        "status",
        "reference",
        "created_at",
        "confirmed_at",
        "tenant_id",
        "invoice:invoices!payments_invoice_id_fkey(id,number,amount_cents,currency,due_date,tenant_id)",
      ].join(",")
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: "load_payment_failed", detail: loadErr.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });

  // 🔒 Narrow away the GenericStringError union before property access
  const payment = data as unknown as PaymentRow;

  const invoice = normalizeOne(payment.invoice as InvoiceRel | InvoiceRel[] | null);
  if (!invoice || !invoice.id) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 400 });
  }

  // Mark payment confirmed
  const nowIso = new Date().toISOString();
  const { error: updPayErr } = await sb
    .from("payments")
    .update({ status: "CONFIRMED", confirmed_at: nowIso })
    .eq("id", paymentId);

  if (updPayErr) {
    return NextResponse.json({ error: "update_payment_failed", detail: updPayErr.message }, { status: 500 });
  }

  // Mark invoice paid
  await sb.from("invoices").update({ status: "PAID" }).eq("id", invoice.id);

  // Lookup tenant email (prefer payment.tenant_id, else invoice.tenant_id)
  const tenantId = (payment.tenant_id as string) || (invoice.tenant_id as string) || null;
  let tenantEmail: string | null = null;
  if (tenantId) {
    const { data: tenantProfile } = await sb
      .from("profiles")
      .select("email")
      .eq("user_id", tenantId)
      .maybeSingle();
    tenantEmail = (tenantProfile?.email as string) || null;
  }

  // Build receipt PDF buffer
  const pdfBuf = await buildReceiptPDFBuffer(
    {
      id: invoice.id,
      number: String(invoice.number),
      amount_cents: Number(invoice.amount_cents ?? payment.amount_cents ?? 0),
      currency: String(invoice.currency ?? payment.currency ?? "PKR"),
      due_date: invoice.due_date || null,
    },
    {
      id: payment.id,
      amount_cents: Number(payment.amount_cents ?? 0),
      currency: String(payment.currency ?? invoice.currency ?? "PKR"),
      reference: payment.reference || null,
      created_at: payment.created_at || null,
      confirmed_at: nowIso,
    },
    tenantEmail
  );

  // Optional email (no-op if key missing)
  if (tenantEmail) {
    const html = `
      <p>Hi,</p>
      <p>Your payment has been confirmed for invoice <strong>${String(invoice.number)}</strong>.</p>
      <p>The receipt PDF is attached for your records.</p>
      <p>— RentBack</p>
    `;
    await sendEmailResend({
      to: tenantEmail,
      subject: `Receipt for ${String(invoice.number)}`,
      html,
      attachments: [
        {
          filename: `receipt-${String(invoice.number)}.pdf`,
          contentType: "application/pdf",
          contentBase64: Buffer.from(pdfBuf).toString("base64"),
        },
      ],
    });
  }

  // Redirect back to Admin Payments
  return NextResponse.redirect(`${URL_APP}/admin/payments?confirmed=1`, { status: 303 });
}
