// app/admin/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  // Auth + role gate (server-side)
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", me.user.id)
    .maybeSingle();

  if (!prof || !["staff", "admin"].includes(String(prof.role))) {
    return NextResponse.json({ error: "not_permitted" }, { status: 403 });
  }

  const form = await req.formData();
  const paymentId = String(form.get("paymentId") || "").trim();
  const invoiceId = String(form.get("invoiceId") || "").trim();

  if (!paymentId || !invoiceId) {
    const url = new URL("/admin/payments?error=invalid_payload", req.url);
    return NextResponse.redirect(url, 303);
  }

  // Load payment + invoice (RLS allows staff/admin)
  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .select("id, amount_cents, currency, status, invoice:invoices(id, number, tenant_id, status)")
    .eq("id", paymentId)
    .maybeSingle();

  if (pErr || !payment) {
    const url = new URL("/admin/payments?error=payment_not_found", req.url);
    return NextResponse.redirect(url, 303);
  }

  const inv = Array.isArray(payment.invoice) ? payment.invoice[0] : payment.invoice;
  if (!inv || inv.id !== invoiceId) {
    const url = new URL("/admin/payments?error=invoice_not_found", req.url);
    return NextResponse.redirect(url, 303);
  }

  // Confirm payment
  const { error: updErr } = await supabase
    .from("payments")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (updErr) {
    const url = new URL("/admin/payments?error=update_failed", req.url);
    return NextResponse.redirect(url, 303);
  }

  // (Simple MVP) Mark invoice paid as well
  try {
    await supabase.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
  } catch {
    // ignore
  }

  // Create receipt row (id auto, lightweight number)
  try {
    const rcptNo = `RCPT-${paymentId.slice(0, 8).toUpperCase()}`;
    await supabase.from("receipts").insert({
      invoice_id: invoiceId,
      payment_id: paymentId,
      number: rcptNo,
    });
  } catch {
    // ignore if duplicate exists or any constraint hit
  }

  // Audit log (best-effort)
  try {
    await supabase.from("audit_log").insert({
      actor_user_id: me.user.id,
      action: "confirm_payment",
      entity_table: "payments",
      entity_id: paymentId,
      metadata_json: { invoice_id: invoiceId },
    });
  } catch {
    // ignore
  }

  const url = new URL("/admin/payments?ok=confirmed", req.url);
  return NextResponse.redirect(url, 303);
}
