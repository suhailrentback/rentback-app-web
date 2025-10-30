// app/api/landlord/invoices/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  tenantEmail: z.string().email(),
  amount: z.union([z.string(), z.number()]),
  currency: z.string().min(3).max(3),
  dueDate: z.string(), // ISO or yyyy-mm-dd
  description: z.string().min(1).max(500).optional().default(""),
  // Use statuses allowed by your DB check constraint
  status: z.enum(["issued", "open", "paid", "overdue"]).default("issued"),
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteSupabase();

    // 1) Auth & caller role
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    const userId = userRes.user.id;

    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (meErr || !me) {
      return NextResponse.json({ error: "profile_not_found" }, { status: 403 });
    }
    if (!["staff", "admin"].includes(String(me.role))) {
      return NextResponse.json({ error: "not_permitted" }, { status: 403 });
    }

    // 2) Validate payload
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.format() },
        { status: 400 }
      );
    }
    const { tenantEmail, amount, currency, dueDate, description, status } =
      parsed.data;

    // 3) Normalize amounts (e.g., "25000" -> 25000 -> 2,500,000 cents)
    const amountNumber =
      typeof amount === "string"
        ? Number(amount.replace(/[, ]+/g, ""))
        : Number(amount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: "amount_invalid" },
        { status: 400 }
      );
    }

    const amountCents = Math.round(amountNumber * 100);
    const currency3 = currency.toUpperCase();

    // 4) Resolve tenant_id via RPC (bypasses RLS ambiguity)
    const { data: tenantId, error: rpcErr } = await supabase.rpc(
      "get_profile_id_by_email",
      { p_email: tenantEmail.toLowerCase().trim() }
    );
    if (rpcErr) {
      return NextResponse.json(
        { error: "tenant_lookup_failed", detail: rpcErr.message },
        { status: 400 }
      );
    }
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenant_not_found" },
        { status: 404 }
      );
    }

    // 5) Insert invoice
    // If your table autogenerates "number", omit it here.
    const { data: inserted, error: insErr } = await supabase
      .from("invoices")
      .insert([
        {
          tenant_id: tenantId,
          status, // must match your CHECK constraint
          issued_at: new Date().toISOString(),
          due_date: new Date(dueDate).toISOString(),
          amount_cents: amountCents,
          total_amount: amountNumber,
          currency: currency3,
          description,
        },
      ])
      .select("id, number")
      .maybeSingle();

    if (insErr) {
      return NextResponse.json(
        { error: "insert_failed", detail: insErr.message },
        { status: 400 }
      );
    }
    if (!inserted) {
      return NextResponse.json(
        { error: "insert_missing_return" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        invoice: {
          id: inserted.id,
          number: inserted.number ?? null,
        },
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "unexpected", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
