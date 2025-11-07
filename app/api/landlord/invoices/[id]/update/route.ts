// app/api/landlord/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Payload = z.object({
  number: z.string().max(64).nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  status: z.enum(["open", "issued", "paid", "overdue", "void"]).nullable().optional(),
  total_amount: z
    .union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)])
    .transform((v) => (typeof v === "number" ? v : parseFloat(v)))
    .nullable()
    .optional(),
  currency: z.string().max(6).nullable().optional(),
  issued_at: z.string().datetime().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();
  const id = params.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = Payload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updates[k] = v;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select(
      "id, number, description, status, total_amount, currency, issued_at, due_date"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, invoice: data });
}
