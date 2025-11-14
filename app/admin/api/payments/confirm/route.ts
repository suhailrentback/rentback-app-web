// app/admin/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE_URL = process.env.SITE_URL || "https://www.rentback.app";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@rentback.app";

function getPaymentIdFrom(req: Request): string | null {
  const ct = req.headers.get("content-type") || "";
  // NOTE: We don't parse here to avoid consuming the body twice; callers must ensure body is FormData for POST forms.
  // Fallback to querystring:
  const u = new globalThis.URL(req.url);
  const qp = u.searchParams.get("paymentId") || u.searchParams.get("id");
  return qp || null;
}

async function requireStaff() {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const };
  const { data: prof } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!prof || !["staff", "admin"].includes((prof as any).role)) return { ok: false as const };
  return { ok: true as const, sb, uid };
}

export async function POST(req: Request) {
  const guard = await requireStaff();
  if (!guard.ok) {
    return NextResponse.json({ error: "not_permitted" }, { status: 403 });
  }
  const { sb } = guard;

  // Collect paymentId from form or query
  let paymentId = getPaymentIdFrom(req);

  if (!paymentId) {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await req.formData();
      paymentId = String(form.get("paymentId") || "");
    } else if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => null)) as any;
      paymentId = body?.paymentId || "";
    }
  }
  if (!paymentId) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  // Load payment + invoice + tenant
  const { data: pay, error: payErr } = await sb
    .from("payments")
    .select("id, status, amount_cents, currency, reference, invoice_id, tenant_id, invoice:invoices(id,number), tenant:profiles(email)")
    .eq("id", paymentId)
    .maybeSingle();

  if (payErr) return NextResponse.json({ error: "load_payment_failed", detail: payErr.message }, { status: 500 });
  if (!pay) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });

  const invoice = Array.isArray(pay.invoice) ? pay.invoice[0] : pay.invoice;
  const tenant = Array.isArray(pay.tenant) ? pay.tenant[0] : pay.tenant;

  if (!invoice?.id) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 400 });
  }

  // If already confirmed, no-op redirect
  if (String(pay.status).toLowerCase() === "confirmed") {
    return NextResponse.redirect(`${SITE_URL}/admin/payments`, 303);
  }

  // Update payment -> confirmed
  const { error: upPayErr } = await sb
    .from("payments")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (upPayErr) return NextResponse.json({ error: "update_payment_failed", detail: upPayErr.message }, { status: 500 });

  // Update invoice -> paid (if you keep "open/paid")
  await sb.from("invoices").update({ status: "paid" }).eq("id", invoice.id);

  // Create receipt row (idempotent-ish: ignore conflict by uniqueness if you add one later)
  await sb.from("receipts").insert({
    invoice_id: invoice.id,
    payment_id: paymentId,
    issued_at: new Date().toISOString(),
  });

  // Email (optional)
  if (RESEND_API_KEY && tenant?.email) {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "www.rentback.app";
    const proto = h.get("x-forwarded-proto") || "https";
    const origin = SITE_URL || `${proto}://${host}`;
    const receiptLink = `${origin}/api/tenant/invoices/${invoice.id}/receipt`;

    // Simple HTML email with link (attachment can be added later)
    const html = `
      <div>
        <p>Hi,</p>
        <p>Your payment has been <strong>confirmed</strong>.</p>
        <p><strong>Invoice:</strong> ${invoice.number || invoice.id}<br/>
           <strong>Amount:</strong> ${(Number(pay.amount_cents || 0) / 100).toFixed(2)} ${pay.currency || ""}<br/>
           <strong>Reference:</strong> ${pay.reference || "-"}
        </p>
        <p>You can download your receipt here:<br/>
          <a href="${receiptLink}">${receiptLink}</a>
        </p>
        <p>— RentBack</p>
      </div>
    `.trim();

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [tenant.email],
        subject: `Receipt for ${invoice.number || invoice.id}`,
        html,
      }),
    }).catch(() => null);
  }

  return NextResponse.redirect(`${SITE_URL}/admin/payments`, 303);
}
