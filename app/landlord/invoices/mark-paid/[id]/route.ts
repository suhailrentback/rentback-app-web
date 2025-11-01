// app/landlord/invoices/mark-paid/[id]/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

const Params = z.object({ id: z.string().uuid() });

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const parse = Params.safeParse(ctx.params);
  const back = new URL("/landlord/invoices", req.url);

  if (!parse.success) {
    return NextResponse.redirect(back);
  }

  const { id } = parse.data;
  const supabase = createRouteSupabase();

  // Update (RLS allows only staff/admin)
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);

  // Always redirect back to list (simple UX, no client JS)
  return NextResponse.redirect(back);
}
