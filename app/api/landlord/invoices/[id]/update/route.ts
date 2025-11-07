// app/api/landlord/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Payload = z.object({
  amount: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().finite().nonnegative()),
  currency: z.string().min(3).max(6),
  description: z.string().max(255).optional().nullable(),
  status: z.enum(["open", "issued", "paid", "overdue", "void"]),
  due_date: z.string().optional().nullable(), // ISO date (YYYY-MM-DD)
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();
  const { id } = params;

  // Accept JSON or form-data
  let body: unknown;
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await req.json();
    } else {
      const fd = await req.formData();
      body = Object.fromEntries(fd.entries());
    }
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const parsed = Payload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { amount, currency, description, status, due_date } = parsed.data;

  // Keep both major/minor units up to date
  const amount_cents = Math.round((amount ?? 0) * 100);
  const update: Record<string, unknown> = {
    total_amount: amount,
    amount_cents,
    currency: (currency || "").toUpperCase(),
    description: description ?? null,
    status,
    // allow null or a valid date
    due_date: due_date ? new Date(due_date) : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("invoices")
    .update(update)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "update_failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
