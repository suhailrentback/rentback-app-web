// app/api/landlord/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UpdateSchema = z
  .object({
    number: z.string().max(64).optional(),
    description: z.string().max(300).optional(),
    currency: z.string().min(3).max(3).optional(),
    total_amount: z.preprocess((v) => {
      if (typeof v === "string") return parseFloat(v);
      return v;
    }, z.number().nonnegative()).optional(),
    due_date: z
      .string()
      .optional()
      .refine((s) => !s || !isNaN(new Date(s).getTime()), "Invalid date"),
    status: z.enum(["open", "issued", "paid", "overdue"]).optional(),
    redirect: z.string().url().optional(), // optional redirect for form POSTs
  })
  .refine((obj) => Object.keys(obj).some((k) =>
    ["number","description","currency","total_amount","due_date","status"].includes(k)
  ), { message: "No updatable fields provided" });

async function handle(req: Request, params: { id: string }) {
  const { id } = params;
  const supabase = createRouteSupabase();

  let payload: any = {};
  const isJSON = (req.headers.get("content-type") || "").includes("application/json");

  if (isJSON) {
    payload = await req.json().catch(() => ({}));
  } else {
    const fd = await req.formData();
    payload = Object.fromEntries(fd.entries());
  }

  const parsed = UpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const v = parsed.data;

  // Prepare updates
  const updates: Record<string, any> = {};
  if (v.number !== undefined) updates.number = v.number || null;
  if (v.description !== undefined) updates.description = v.description || null;
  if (v.currency !== undefined) updates.currency = v.currency.toUpperCase();
  if (v.total_amount !== undefined) {
    updates.total_amount = v.total_amount;
    updates.amount_cents = Math.round((v.total_amount || 0) * 100);
  }
  if (v.status !== undefined) updates.status = v.status;
  if (v.due_date !== undefined) {
    updates.due_date = v.due_date ? new Date(v.due_date).toISOString() : null;
  }

  // Perform update (RLS must allow staff/admin)
  const { data, error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "update_failed", details: error?.message },
      { status: 400 }
    );
  }

  // If form POST provided redirect, go there
  if (!isJSON && v.redirect) {
    return NextResponse.redirect(v.redirect, { status: 303 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(req, params);
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(req, params);
}
