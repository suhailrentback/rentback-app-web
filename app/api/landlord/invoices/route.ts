// app/api/landlord/invoices/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateInvoice = z.object({
  tenant_id: z.string().uuid(),
  description: z.string().min(1).max(500),
  total_amount: z.number().positive(), // e.g. 25000 for PKR
  currency: z.string().min(1).max(8).default("PKR"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  number: z.string().min(1).max(64).optional(),      // e.g. INV-2025-001
  status: z.enum(["open", "paid"]).default("open"),
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  // Must be signed in
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: friendly pre-check (RLS already enforces this on insert)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  const role = (profile as any)?.role ?? null;
  if (role !== "landlord" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate payload
  let payload: z.infer<typeof CreateInvoice>;
  try {
    const json = await req.json();
    payload = CreateInvoice.parse(json);
  } catch (e) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Normalize amounts for DB
  const amount_cents = Math.round(payload.total_amount * 100);
  const issued_at = new Date().toISOString();

  const row = {
    tenant_id: payload.tenant_id,
    description: payload.description,
    currency: payload.currency,
    status: payload.status,
    number: payload.number ?? null,
    issued_at,
    due_date: payload.due_date,
    total_amount: payload.total_amount,
    amount_cents,
  };

  // Insert (RLS checks landlord/staff via policy you added)
  const { data, error } = await supabase
    .from("invoices")
    .insert(row as any)
    .select("id")
    .maybeSingle();

  if (error) {
    // Common errors: RLS deny, bad tenant_id, constraint failures
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const id = (data as any)?.id as string | undefined;
  return NextResponse.json({ id }, { status: 201 });
}
