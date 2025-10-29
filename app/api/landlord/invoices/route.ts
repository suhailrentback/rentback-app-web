// app/api/landlord/invoices/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateInvoice = z.object({
  tenantEmail: z.string().email("Enter a valid tenant email"),
  amount: z
    .coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  currency: z
    .string()
    .trim()
    .min(3, "Currency must be a 3-letter code")
    .max(3, "Currency must be a 3-letter code")
    .transform((s) => s.toUpperCase()),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for due date"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(280, "Description is too long"),
});

function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(req: Request) {
  // 1) Parse/validate JSON
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = CreateInvoice.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return jsonError("Invalid payload", 400, { fieldErrors, formErrors });
  }

  const { tenantEmail, amount, currency, dueDate, description } = parsed.data;

  // 2) Supabase (with RLS as the signed-in landlord/staff)
  const supabase = createRouteSupabase();

  // Optional: ensure caller is staff/admin (you already enforce with RLS, this is just a friendly check)
  // If you have an rb_role cookie / session you can call /api/auth/sync on client before posting.
  // Here we rely on DB RLS for the true enforcement.

  // 3) Resolve tenant by email
  const { data: tenant, error: tenantErr } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", tenantEmail)
    .maybeSingle();

  if (tenantErr) {
    return jsonError("Lookup failed for tenant", 500, { detail: tenantErr.message });
  }
  if (!tenant) {
    return jsonError("Tenant not found for that email", 404);
  }

  // 4) Prepare insert
  const amountCents = Math.round(amount * 100);
  const number =
    "INV-" + String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

  // Use a safe initial status your CHECK allows, e.g. 'open' or 'issued'
  const invoiceRow = {
    tenant_id: tenant.id,
    status: "open" as const,
    issued_at: new Date().toISOString(),
    due_date: dueDate, // 'YYYY-MM-DD' is fine for a date/timestamptz column
    amount_cents: amountCents,
    total_amount: amount,
    currency,
    description,
    number,
  };

  const { data: created, error: insertErr } = await supabase
    .from("invoices")
    .insert(invoiceRow)
    .select("id, number")
    .maybeSingle();

  if (insertErr) {
    return jsonError("Insert failed", 500, { detail: insertErr.message });
  }

  return NextResponse.json(
    {
      ok: true,
      id: created?.id,
      number: created?.number,
      message: "Invoice created",
    },
    { status: 201 }
  );
}
