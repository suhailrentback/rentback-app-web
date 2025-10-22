import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Payload = z.object({
  tenant_email: z.string().email().optional(),
  tenant_id: z.string().uuid().optional(),
  number: z.string().min(1).max(64).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  total_amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  issued_at: z.string().datetime().optional(),
  due_date: z.string().datetime(),
}).refine((v) => v.tenant_email || v.tenant_id, {
  message: "Provide tenant_email or tenant_id",
  path: ["tenant_email"],
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  // must be signed in
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // optional: check profile role (RLS still protects at DB)
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  // Soft gate: allow landlord or staff; otherwise rely on RLS to reject
  const role = String(prof?.role ?? "").toLowerCase();
  if (role !== "landlord" && role !== "staff" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof Payload>;
  try {
    body = Payload.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Resolve tenant_id from email if needed
  let tenantId = body.tenant_id ?? null;
  if (!tenantId && body.tenant_email) {
    const { data: tenant } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", body.tenant_email.toLowerCase())
      .maybeSingle();
    if (!tenant?.id) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    tenantId = tenant.id;
  }

  const amountCents = Math.round(body.total_amount * 100);
  const nowIso = new Date().toISOString();

  const insertRow = {
    tenant_id: tenantId,
    number: body.number ?? null,
    description: body.description ?? null,
    currency: body.currency,
    total_amount: body.total_amount, // human-readable amount
    amount_cents: amountCents,       // NOT NULL in DB
    status: "open",                  // valid per invoices_status_check
    issued_at: body.issued_at ?? nowIso,
    due_date: body.due_date,
  };

  const { data, error } = await supabase
    .from("invoices")
    .insert(insertRow)
    .select("id, number")
    .maybeSingle();

  if (error) {
    // Let RLS/constraints bubble up as a clean error
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data?.id, number: data?.number ?? null });
}
