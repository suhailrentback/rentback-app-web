// app/tenant/api/payments/create/route.ts
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

  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) {
    return NextResponse.redirect(new URL("/sign-in", req.url), 303);
  }

  const form = await req.formData();
  const invoiceId = String(form.get("invoiceId") || "");
  const reference = String(form.get("reference") || "").trim();
  const amountStr = String(form.get("amount") || "").trim();

  if (!invoiceId || !reference || !amountStr || isNaN(Number(amountStr))) {
    return NextResponse.redirect(new URL(`/tenant/invoices?error=invalid_payload`, req.url), 303);
  }

  // Load the invoice (RLS will also protect this)
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, tenant_id, currency")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    return NextResponse.redirect(new URL(`/tenant/invoices?error=invoice_not_found`, req.url), 303);
  }

  // Tenant-only guard: must be your invoice
  if (invoice.tenant_id !== me.user.id) {
    return NextResponse.redirect(new URL(`/tenant/invoices/${invoiceId}?error=not_permitted`, req.url), 303);
  }

  const amountCents = Math.max(1, Math.round(Number(amountStr) * 100));
  const currency = String(invoice.currency ?? "PKR");

  // Insert payment as 'submitted'
  const { error: insErr } = await supabase.from("payments").insert({
    tenant_id: me.user.id,
    invoice_id: invoiceId,
    amount_cents: amountCents,
    currency,
    status: "submitted",
    reference,
  });

  if (insErr) {
    const u = new URL(`/tenant/invoices/${invoiceId}?error=insert_failed`, req.url);
    return NextResponse.redirect(u, 303);
  }

  // Best-effort audit (ignore failures)
  try {
    await supabase.from("audit_log").insert({
      actor_user_id: me.user.id,
      action: "create_payment",
      entity_table: "payments",
      entity_id: invoiceId,
      metadata_json: { amount_cents: amountCents, currency, reference },
    });
  } catch {
    // ignore
  }

  const u = new URL(`/tenant/invoices/${invoiceId}?ok=payment_submitted`, req.url);
  return NextResponse.redirect(u, 303);
}
