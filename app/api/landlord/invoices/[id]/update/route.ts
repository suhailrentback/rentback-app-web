// app/api/landlord/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getStr(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function getDateOrNull(fd: FormData, key: string): string | null {
  const raw = getStr(fd, key);
  if (!raw) return null;
  // Expect YYYY-MM-DD; keep as-is (Postgres can cast)
  return raw;
}
function safeCurrency(s: string): string | null {
  const v = s.trim().toUpperCase();
  if (!v) return null;
  // Keep simple; DB can enforce length if needed
  return v;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteSupabase();
  const { id } = params;

  const fd = await req.formData();

  const number = getStr(fd, "number");
  const description = getStr(fd, "description");
  const statusRaw = getStr(fd, "status").toLowerCase();
  const issued_at = getDateOrNull(fd, "issued_at");
  const due_date = getDateOrNull(fd, "due_date");
  const totalStr = getStr(fd, "total_amount");
  const currency = safeCurrency(getStr(fd, "currency") || "PKR");

  // Validate status (current enum in DB: 'open' | 'paid')
  const status = statusRaw === "paid" ? "paid" : "open";

  // Validate amount
  const total = Number(totalStr);
  if (!Number.isFinite(total) || total < 0) {
    return NextResponse.json(
      { error: "invalid_amount" },
      { status: 400 }
    );
  }
  const amount_cents = Math.round(total * 100);

  // Build update payload (omit empties)
  const payload: Record<string, unknown> = {
    status,
    issued_at: issued_at ?? null,
    due_date: due_date ?? null,
    total_amount: total,
    amount_cents,
    currency,
  };
  if (number) payload.number = number;
  if (description) payload.description = description;

  // Perform update with RLS
  const { data, error } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    // Surface common RLS issue
    const code = (error as any)?.code ?? "";
    if (code === "42501") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "update_failed" }, { status: 400 });
  }

  // Redirect back to landlord list (keeps things simple & robust)
  const url = new URL("/landlord/invoices", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
