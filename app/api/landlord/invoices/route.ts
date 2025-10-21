// app/api/landlord/invoices/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateInvoiceInput = z.object({
  tenant_email: z.string().email(),
  description: z.string().min(1).max(2000),
  total_amount: z.number().positive().max(1_000_000_000),
  currency: z.string().min(3).max(3).optional().default("PKR"),
  due_date: z.string().optional(), // ISO date (yyyy-mm-dd) or full ISO string
  number: z.string().optional(),   // optional custom invoice number
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  // Auth
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Role check
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }
  if (!prof || !["landlord", "staff"].includes(String(prof.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateInvoiceInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tenant_email, description, total_amount, currency, due_date, number } =
    parsed.data;

  // Resolve tenant by email
  const { data: tenant, error: tenantErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", tenant_email)
    .maybeSingle();

  if (tenantErr) {
    return NextResponse.json({ error: tenantErr.message }, { status: 500 });
  }
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Dates + amounts
  const nowIso = new Date().toISOString();
  const dueIso = due_date ? new Date(due_date).toISOString() : new Date(Date.now() + 14 * 864e5).toISOString();
  const amountCents = Math.round(total_amount * 100);
  const invoiceNumber = number ?? `INV-${Date.now()}`;

  // Insert (status = 'open' to satisfy enum policy)
  const { data: inserted, error: insErr } = await supabase
    .from("invoices")
    .insert([
      {
        tenant_id: tenant.id,
        status: "open",
        issued_at: nowIso,
        due_date: dueIso,
        amount_cents: amountCents,
        total_amount: total_amount,
        currency,
        description,
        number: invoiceNumber,
      },
    ])
    .select("id, number")
    .maybeSingle();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  return NextResponse.json(
    { ok: true, id: inserted?.id, number: inserted?.number },
    { status: 201 }
  );
}
