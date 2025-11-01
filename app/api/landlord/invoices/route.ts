// app/api/landlord/invoices/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Payload = z.object({
  tenantEmail: z.string().email(),
  number: z.string().min(1),
  description: z.string().min(1),
  currency: z.string().min(3).max(3),
  total_amount: z.number().positive(), // e.g., 25000
  due_date: z.string().min(1),         // ISO date string (YYYY-MM-DD)
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  // 1) Caller must be signed in
  const { data: uData, error: uErr } = await supabase.auth.getUser();
  if (uErr || !uData?.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // 2) Ensure caller has a profile (auto-create if missing)
  const { data: me, error: meErr } = await supabase.rpc("ensure_profile");
  if (meErr || !me) {
    return NextResponse.json(
      { error: "profile_init_failed", detail: meErr?.message },
      { status: 500 }
    );
  }

  // 3) Authorize: only staff/admin can create invoices for now
  const role = String(me.role || "").toLowerCase();
  if (!["staff", "admin"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 4) Parse payload
  let body: z.infer<typeof Payload>;
  try {
    body = Payload.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // 5) Resolve tenant by email (auto-create profile if needed)
  const { data: tenantId, error: lookupErr } = await supabase.rpc("tenant_id_by_email", {
    email_input: body.tenantEmail,
  });

  if (lookupErr) {
    return NextResponse.json(
      { error: "tenant_lookup_failed", detail: lookupErr.message },
      { status: 500 }
    );
  }
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  // 6) Insert invoice (respect your schema columns)
  const { error: insErr, data: inserted } = await supabase
    .from("invoices")
    .insert({
      tenant_id: tenantId as string,
      status: "open", // start as OPEN
      issued_at: new Date().toISOString(),
      due_date: body.due_date,
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
