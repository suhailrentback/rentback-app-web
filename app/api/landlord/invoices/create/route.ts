import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({
  tenant_email: z.string().email(),
  amount: z.union([z.number(), z.string()]), // accept "25000" or 25000
  currency: z.string().default("PKR"),
  due_date: z.string().min(8), // YYYY-MM-DD
  description: z.string().max(500).optional(),
  number: z.string().max(64).optional(), // optional human ref
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  // Authn
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role check (landlord or staff)
  const { data: meRole } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const myRole = (meRole?.role ?? "").toLowerCase();
  if (myRole !== "landlord" && myRole !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate body
  let body: z.infer<typeof Body>;
  try {
    const raw = await req.json();
    body = Body.parse(raw);
  } catch (e) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const tenantEmail = body.tenant_email.trim().toLowerCase();
  const amountNum =
    typeof body.amount === "string" ? parseFloat(body.amount) : body.amount;
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }
  const amountCents = Math.round(amountNum * 100);

  // Lookup tenant by email (role=tenant)
  const { data: tenant } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", tenantEmail)
    .eq("role", "tenant")
    .maybeSingle();

  if (!tenant?.id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Insert invoice
  const payload = {
    tenant_id: tenant.id,
    status: "open", // must match your CHECK constraint
    issued_at: new Date().toISOString(),
    due_date: body.due_date, // YYYY-MM-DD is fine for a date column
    amount_cents: amountCents,
    total_amount: amountNum, // for display
    currency: body.currency.toUpperCase(),
    description: body.description ?? null,
    number: body.number ?? null,
  };

  const { data: inserted, error } = await supabase
    .from("invoices")
    .insert(payload)
    .select("id, number")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 400 });
  }

  return NextResponse.json({
    id: inserted.id,
    number: inserted.number,
    tenant_invoice_url: `/tenant/invoices/${inserted.id}`,
  });
}
