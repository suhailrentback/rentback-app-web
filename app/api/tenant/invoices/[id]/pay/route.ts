// app/api/tenant/invoices/[id]/pay/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  // Auth
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const invoiceId = params.id;

  // Verify invoice belongs to this tenant; also fetch currency
  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("id, tenant_id, currency")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invErr || !inv) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 404 });
  }
  if (String(inv.tenant_id) !== String(me.user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Parse formData
  const form = await req.formData();
  const reference = String(form.get("reference") ?? "").trim();
  const amountStr = String(form.get("amount") ?? "").trim();

  if (!reference || !amountStr) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Convert to cents safely
  const amount = Number(amountStr.replace(/,/g, ""));
  if (!isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }
  const amount_cents = Math.round(amount * 100);

  // Insert payment (let status default in DB)
  const { error: insErr } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    tenant_id: me.user.id,
    amount_cents,
    currency: inv.currency ?? "PKR",
    reference,
  });

  if (insErr) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // Redirect back to invoice page with success toast flag
  const url = new URL(`/tenant/invoices/${invoiceId}?pay=ok`, process.env.SITE_URL || "https://www.rentback.app");
  return NextResponse.redirect(url, 303);
}
