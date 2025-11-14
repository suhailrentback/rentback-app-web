// app/tenant/api/payments/create/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });

  // Auth
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) {
    return new NextResponse(null, { status: 303, headers: { Location: "/not-permitted" } });
  }

  // Form payload
  const form = await req.formData();
  const invoiceId = String(form.get("invoiceId") || "");
  let reference = String(form.get("reference") || "").trim();

  if (!invoiceId) {
    return NextResponse.json({ error: "invalid_invoice" }, { status: 400 });
  }

  // Load invoice (RLS still enforces tenant scope)
  const { data: inv, error: invErr } = await sb
    .from("invoices")
    .select("id, tenant_id, amount_cents, currency, number, status")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invErr) {
    return NextResponse.json({ error: "load_invoice_failed", detail: invErr.message }, { status: 500 });
  }
  if (!inv) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 404 });
  }
  if (inv.tenant_id !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (inv.status === "paid") {
    return NextResponse.json({ error: "already_paid" }, { status: 400 });
  }

  if (!reference) {
    const base = inv.number || `INV-${String(inv.id).slice(0, 8)}`;
    reference = base;
  }

  // Insert payment (pending)
  const { error: insErr } = await sb.from("payments").insert({
    invoice_id: inv.id,
    tenant_id: uid,
    amount_cents: inv.amount_cents ?? 0,
    currency: inv.currency ?? "PKR",
    status: "pending",
    reference,
  });

  if (insErr) {
    return NextResponse.json({ error: "insert_failed", detail: insErr.message }, { status: 500 });
  }

  // Redirect back to tenant payments list
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/tenant/payments?created=1" },
  });
}
