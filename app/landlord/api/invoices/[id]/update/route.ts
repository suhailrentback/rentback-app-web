// app/landlord/api/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ALLOWED_STATUS = new Set([
  "draft","issued","open","paid","overdue","void",
]);

export async function POST(
  req: Request,
  ctx: { params: { id: string } }
) {
  const id = ctx.params.id;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const {
    number,
    description,
    amount,      // major units (e.g., 25000.00)
    currency,
    status,
    due_date,   // YYYY-MM-DD
  } = body as {
    number?: string | null;
    description?: string | null;
    amount?: number | null;
    currency?: string | null;
    status?: string | null;
    due_date?: string | null;
  };

  // Basic validation (client also validates)
  if (status && !ALLOWED_STATUS.has(String(status))) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  let amount_cents: number | null = null;
  if (typeof amount === "number" && isFinite(amount) && amount >= 0) {
    amount_cents = Math.round(amount * 100);
  } else if (amount === null) {
    amount_cents = null;
  }

  // Build update patch (only defined keys)
  const patch: Record<string, any> = {};
  if (typeof number !== "undefined") patch.number = number;
  if (typeof description !== "undefined") patch.description = description;
  if (typeof currency !== "undefined") patch.currency = currency?.toUpperCase?.() ?? currency;
  if (typeof status !== "undefined") patch.status = status;
  if (typeof due_date !== "undefined") patch.due_date = due_date ? new Date(due_date).toISOString().slice(0,10) : null;
  if (typeof amount_cents !== "undefined") patch.amount_cents = amount_cents;

  // Connect to Supabase as the logged-in user
  const cookieStore = cookies();
  const supabase = createServerClient(URL, ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  // Must be authenticated
  const { data: meRes } = await supabase.auth.getUser();
  if (!meRes?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS handles whether this user can update this invoice
  const { data, error } = await supabase
    .from("invoices")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
