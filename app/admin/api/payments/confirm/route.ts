// app/admin/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE_URL = process.env.SITE_URL || "https://www.rentback.app";

function makeReceiptNumber(): string {
  return "RCPT-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const paymentId = String(formData.get("paymentId") ?? "");

  if (!paymentId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  // --- Guard: staff/admin only ---
  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("id, role, email")
    .single();

  if (meErr || !me || !["staff", "admin"].includes(String(me.role))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // --- Fetch payment + invoice (scoped join) ---
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .select(
      `
        id, status, amount_cents, currency, reference, created_at, confirmed_at,
        tenant_id, invoice_id,
        invoice:invoices!payments_invoice_id_fkey ( id, number, tenant_id, status )
      `
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (payErr || !payment) {
    return NextResponse.json({ error: "payment_not_found" }, { status: 404 });
  }

  const inv = Array.isArray(payment.invoice)
    ? payment.invoice?.[0] ?? null
    : payment.invoice ?? null;

  if (!inv) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 400 });
  }

  // If already confirmed, just head back (idempotent UX)
  if (String(payment.status) === "confirmed") {
    const url = new URL(`/admin/payments?confirmed=${paymentId}`, SITE_URL);
    return NextResponse.redirect(url, 303);
  }

  // --- 1) Confirm the payment ---
  {
    const { error } = await supabase
      .from("payments")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (error) {
      return NextResponse.json(
        { error: "update_payment_failed", detail: error.message },
        { status: 500 }
      );
    }
  }

  // --- 2) Mark invoice paid ---
  {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", inv.id);

    if (error) {
      return NextResponse.json(
        { error: "update_invoice_failed", detail: error.message },
        { status: 500 }
      );
    }
  }

  // --- 3) Insert receipt ---
  const rcptNumber = makeReceiptNumber();
  const {
    data: receipt,
    error: rcptErr,
  } = await supabase
    .from("receipts")
    .insert({
      invoice_id: inv.id,
      payment_id: paymentId,
      number: rcptNumber,
      // issued_at defaults in DB if present; else we rely on created_at
    })
    .select("id, number")
    .single();

  if (rcptErr || !receipt) {
    return NextResponse.json(
      { error: "insert_receipt_failed", detail: rcptErr?.message ?? "" },
      { status: 500 }
    );
  }

  // --- 4) Audit log (best-effort; ignore failures) ---
  await supabase.from("audit_log").insert([
    {
      entity: "payment",
      entity_id: paymentId,
      action: "confirm",
      actor_user_id: me.id,
    },
    {
      entity: "invoice",
      entity_id: inv.id,
      action: "paid",
      actor_user_id: me.id,
    },
    {
      entity: "receipt",
      entity_id: receipt.id,
      action: "issue",
      actor_user_id: me.id,
    },
  ]);

  // --- 5) Optional email send (no-op if you don't wire a provider) ---
  // Placeholder: if you later add RESEND or SMTP, trigger an email here with a
  // link to the receipt PDF:
  //   `${SITE_URL}/api/tenant/invoices/${inv.id}/receipt`
  // Keep this as a no-op to avoid new deps.

  // Redirect back to Admin Payments with success params
  const url = new URL("/admin/payments", SITE_URL);
  url.searchParams.set("confirmed", paymentId);
  url.searchParams.set("receipt", receipt.number);
  return NextResponse.redirect(url, 303);
}
