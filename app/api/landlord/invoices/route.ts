// app/api/landlord/invoices/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({
  tenant_id: z.string().uuid(),
  number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  total_amount: z.number().positive(),
  currency: z.string().min(1),
  // Accept yyyy-mm-dd (DATE) or full ISO; we’ll normalize to yyyy-mm-dd
  due_date: z.string().min(1),
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { tenant_id, number, description, total_amount, currency, due_date } =
    parsed.data;

  // Normalize date as yyyy-mm-dd for DATE columns
  const due = new Date(due_date);
  const dueStr = isNaN(due.getTime())
    ? null
    : due.toISOString().slice(0, 10);
  if (!dueStr) {
    return NextResponse.json({ error: "Invalid due_date" }, { status: 400 });
  }

  const amount_cents = Math.round(total_amount * 100);

  const { data, error } = await supabase
    .from("invoices")
    .insert([
      {
        tenant_id,
        number: number || null,
        description: description || null,
        status: "open",
        issued_at: new Date().toISOString(),
        due_date: dueStr,
        amount_cents,
        total_amount,
        currency,
      },
    ])
    .select("id")
    .single();

  if (error) {
    const msg = error.message || "Insert failed";
    const code = /row-level security/i.test(msg) ? 403 : 400;
    return NextResponse.json({ error: msg }, { status: code });
  }

  return NextResponse.json({ id: data.id });
}
