// app/landlord/api/payouts/request/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function supabaseFromCookies() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
  return sb;
}

async function getAuthedUser() {
  const sb = supabaseFromCookies();
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return { ok: false as const, error: "unauthorized" as const };
  return { ok: true as const, sb, uid: data.user.id };
}

async function parseAmountCents(v: unknown) {
  if (typeof v === "number") return Math.round(v * 100);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) return Math.round(n * 100);
  }
  return null;
}

export async function POST(req: Request) {
  const guard = await getAuthedUser();
  if (!guard.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { sb, uid } = guard;

  // Accept form-encoded or JSON
  let amountInput: unknown = null;
  let currency = "PKR";
  let notes: string | null = null;

  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    amountInput = fd.get("amount");
    currency = (fd.get("currency") as string) || "PKR";
    notes = (fd.get("notes") as string) || null;
  } else {
    const body = await req.json().catch(() => ({}));
    amountInput = body.amount;
    currency = body.currency || "PKR";
    notes = body.notes ?? null;
  }

  // If no amount provided, suggest from landlord_balances view
  let amount_cents = await parseAmountCents(amountInput);
  if (amount_cents == null) {
    const { data: balRows, error: balErr } = await sb
      .from("landlord_balances")
      .select("*")
      .eq("landlord_id", uid)
      .eq("currency", currency)
      .maybeSingle();
    if (balErr) {
      return NextResponse.json({ error: "balance_load_failed", detail: balErr.message }, { status: 500 });
    }
    amount_cents = Math.max(0, Number(balRows?.balance_cents || 0));
  }

  if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  // Insert payout request (RLS: landlord can insert their own pending)
  const { error: insErr } = await sb.from("landlord_payouts").insert({
    landlord_id: uid,
    amount_cents,
    currency,
    status: "pending",
    requested_by: uid,
    notes,
  });

  if (insErr) {
    return NextResponse.json({ error: "insert_failed", detail: insErr.message }, { status: 500 });
  }

  // Optional: create a matching ledger debit placeholder (source='payout', type='debit') AFTER approval normally.
  // For now, we only create the request record.

  const url = new URL("/landlord/payouts?ok=1", process.env.SITE_URL || "https://www.rentback.app");
  return NextResponse.redirect(url, 303);
}
