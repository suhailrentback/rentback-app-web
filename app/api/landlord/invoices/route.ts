// app/api/landlord/invoices/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Coercions + normalization:
// - total_amount: accepts "25000" and 25000
// - currency: trims and UPPERCASE
// - emails/strings: trimmed
const Payload = z.object({
  tenantEmail: z.string().email().transform((s) => s.trim().toLowerCase()),
  number: z.string().min(1, "Invoice number is required").transform((s) => s.trim()),
  description: z.string().min(1, "Description is required").transform((s) => s.trim()),
  currency: z
    .string()
    .min(3)
    .max(3)
    .transform((s) => s.trim().toUpperCase()),
  total_amount: z.coerce.number().positive("Amount must be > 0"),
  // Accept YYYY-MM-DD from <input type="date">
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD"),
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  // Auth check
  const { data: uData, error: uErr } = await supabase.auth.getUser();
  if (uErr || !uData?.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // Ensure caller has a profile
  const { data: me, error: meErr } = await supabase.rpc("ensure_profile");
  if (meErr || !me) {
    return NextResponse.json(
      { error: "profile_init_failed", detail: meErr?.message },
      { status: 500 }
    );
  }

  // Authorization: only staff/admin can create invoices
  const role = String(me.role || "").toLowerCase();
  if (!["staff", "admin"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Parse + normalize payload
  let body: z.infer<typeof Payload>;
  try {
    const raw = await req.json().catch(() => ({}));
    // Fallback: if client sent "amount" instead of "total_amount"
    const normalized = {
      ...raw,
      total_amount: raw?.total_amount ?? raw?.amount,
    };
    body = Payload.parse(normalized);
  } catch (e: any) {
    // Return Zod issues to help diagnose in dev
    const issues = e?.issues ?? null;
    return NextResponse.json(
      { error: "invalid_payload", issues },
      { status: 400 }
    );
  }

  // Resolve tenant id by email (auto-creates profile if needed)
  const { data: tenantId, error: lookupErr } = await supabase.rpc(
    "tenant_id_by_email",
    { email_input: body.tenantEmail }
  );

  if (lookupErr) {
    return NextResponse.json(
      { error: "tenant_lookup_failed", detail: lookupErr.message },
      { status: 500 }
    );
  }
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  // Insert invoice
  const { error: insErr, data: inserted } = await supabase
    .from("invoices")
    .insert({
      tenant_id: String(tenantId),
      status: "open",
      issued_at: new Date().toISOString(),
      due_date: body.due_date, // YYYY-MM-DD string is fine; Postgres casts to date/timestamptz per column
      amount_cents: Math.round(body.total_amount * 100),
      total_amount: body.total_amount,
      currency: body.currency,
      description: body.description,
      number: body.number,
    })
    .select("id, number")
    .maybeSingle();

  if (insErr) {
    return NextResponse.json(
      { error: "insert_failed", detail: insErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, invoice: inserted }, { status: 201 });
}
