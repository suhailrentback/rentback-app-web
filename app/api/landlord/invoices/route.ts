import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Accepts both JSON and FormData; coerces numbers/dates safely
const Body = z.object({
  tenantEmail: z.string().email(),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? parseFloat(v.replace(/,/g, "")) : v))
    .refine((v) => Number.isFinite(v) && v > 0, "Amount must be > 0"),
  currency: z.string().min(1).max(8).default("PKR"),
  description: z.string().max(500).optional().default(""),
  dueDate: z
    .union([z.string(), z.date()])
    .transform((v) => {
      const d = typeof v === "string" ? new Date(v) : v;
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    })
    .refine((d) => !Number.isNaN(d.getTime()), "Invalid date"),
});

async function parseBody(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await req.json();
  }
  // Handle application/x-www-form-urlencoded or multipart/form-data
  const fd = await req.formData();
  return {
    tenantEmail: (fd.get("tenantEmail") ?? "").toString(),
    amount: (fd.get("amount") ?? "").toString(),
    currency: (fd.get("currency") ?? "PKR").toString(),
    description: (fd.get("description") ?? "").toString(),
    dueDate: (fd.get("dueDate") ?? "").toString(),
  };
}

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  // 1) Parse + validate
  const raw = await parseBody(req);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { tenantEmail, amount, currency, description, dueDate } = parsed.data;

  // 2) Resolve tenant by email (profiles.email)
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("email", tenantEmail)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 400 });
  }
  if (!profile?.id) {
    return NextResponse.json({ error: "Tenant email not found" }, { status: 404 });
  }

  // 3) Prepare amounts/dates
  const amount_cents = Math.round(amount * 100);
  // If your column is DATE, sending an ISO date string "YYYY-MM-DD" is safe:
  const due_date_sql = dueDate.toISOString().slice(0, 10);

  // 4) Insert invoice (status: 'issued' satisfies our CHECK constraint)
  const { data: inv, error: iErr } = await supabase
    .from("invoices")
    .insert({
      tenant_id: profile.id,
      status: "issued",
      issued_at: new Date().toISOString(),
      due_date: due_date_sql,
      amount_cents,
      total_amount: amount,
      currency,
      description,
    })
    .select("id, number")
    .single();

  if (iErr) {
    return NextResponse.json({ error: iErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: inv.id, number: inv.number ?? null });
}
