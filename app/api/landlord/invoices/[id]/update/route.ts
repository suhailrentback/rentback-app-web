// app/api/landlord/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

function parseAmount(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? Number(v) : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteSupabase();
  const { id } = params;

  const form = await req.formData();
  const status = (form.get("status") || "").toString().toLowerCase();
  const due_date_raw = (form.get("due_date") || "").toString();
  const total_amount = parseAmount(form.get("total_amount"));
  const currency = (form.get("currency") || "").toString().toUpperCase().slice(0, 3);
  const description = (form.get("description") || "").toString();

  const ALLOWED_STATUS = new Set(["draft", "open", "issued", "paid", "overdue"]);
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    status,
    description,
  };

  if (due_date_raw) {
    // keep as YYYY-MM-DD (date column) or ISO if timestamp; DB will cast if needed
    updates.due_date = due_date_raw;
  } else {
    updates.due_date = null;
  }

  if (total_amount != null) {
    updates.total_amount = total_amount;
    updates.amount_cents = Math.round(total_amount * 100);
  }

  if (currency) {
    updates.currency = currency;
  }

  const { error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    // Redirect back with a simple error flag the page can show later if needed
    const to = new URL("/landlord/invoices", req.url);
    to.searchParams.set("err", "update_failed");
    return NextResponse.redirect(to, 303);
  }

  // PRG: redirect to list after success
  const to = new URL("/landlord/invoices", req.url);
  to.searchParams.set("ok", "updated");
  return NextResponse.redirect(to, 303);
}
