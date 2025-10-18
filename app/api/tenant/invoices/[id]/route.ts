import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  amount_cents: z.coerce.number().nullable().optional(),
  total_amount: z.coerce.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, amount_cents, total_amount, currency, description"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Invoice not found" },
      { status: 404 }
    );
  }

  const parsed = Invoice.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice shape" }, { status: 500 });
  }

  return NextResponse.json(parsed.data, { status: 200 });
}
