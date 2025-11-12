// app/admin/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sb = createRouteSupabase();

  // Must be signed in
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id ?? null;
  if (!uid) {
    return NextResponse.redirect(new URL("/sign-in", req.url), { status: 303 });
  }

  // Must be staff/admin
  const { data: me } = await sb
    .from("profiles")
    .select("id, role")
    .eq("id", uid)
    .maybeSingle();

  if (!me || !["staff", "admin"].includes(String(me.role))) {
    return NextResponse.redirect(new URL("/not-permitted", req.url), {
      status: 303,
    });
  }

  // Accept simple form POST
  const form = await req.formData();
  const paymentId = String(form.get("paymentId") ?? "").trim();

  if (!paymentId) {
    return NextResponse.redirect(
      new URL("/admin/payments?error=invalid_payload", req.url),
      { status: 303 }
    );
  }

  // Load payment with its invoice
  const { data: pay, error: payErr } = await sb
    .from("payments")
    .select("id, status, invoice_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (payErr || !pay) {
    return NextResponse.redirect(
      new URL("/admin/payments?error=payment_not_found", req.url),
      { status: 303 }
    );
  }

  if (String(pay.status) !== "submitted") {
    return NextResponse.redirect(
      new URL("/admin/payments?error=already_processed", req.url),
      { status: 303 }
    );
  }

  const invoiceId = (pay as any).invoice_id as string | null;
  if (!invoiceId) {
    return NextResponse.redirect(
      new URL("/admin/payments?error=missing_invoice", req.url),
      { status: 303 }
    );
  }

  // Confirm payment
  const { error: updPayErr } = await sb
    .from("payments")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (updPayErr) {
    return NextResponse.redirect(
      new URL("/admin/payments?error=confirm_failed", req.url),
      { status: 303 }
    );
  }

  // Flip invoice to PAID
  const { error: updInvErr } = await sb
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoiceId);

  if (updInvErr) {
    return NextResponse.redirect(
      new URL("/admin/payments?error=invoice_update_failed", req.url),
      { status: 303 }
    );
  }

  // (3.4 will insert a receipt row + send email; kept out here to avoid surprises)
  return NextResponse.redirect(new URL("/admin/payments?ok=confirmed", req.url), {
    status: 303,
  });
}
