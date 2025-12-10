// app/admin/api/payouts/decide/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function sbFromCookies() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

async function getAuthedStaff() {
  const sb = sbFromCookies();
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user) return { ok: false as const, status: 401, msg: "unauthorized" as const };
  const { data: prof } = await sb.from("profiles").select("id, role").limit(1);
  const role = prof?.[0]?.role;
  if (role !== "staff" && role !== "admin") return { ok: false as const, status: 403, msg: "forbidden" as const };
  return { ok: true as const, sb, uid: userRes.user.id };
}

export async function POST(req: Request) {
  const guard = await getAuthedStaff();
  if (!guard.ok) {
    return NextResponse.redirect(new globalThis.URL("/admin/payouts?err=forbidden", process.env.SITE_URL), 303);
  }
  const { sb, uid } = guard;

  // Support form or JSON
  const ct = req.headers.get("content-type") || "";
  let id = "";
  let decision = "";
  let notes: string | null = null;

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    id = String(fd.get("id") || "");
    decision = String(fd.get("decision") || "");
    notes = (fd.get("notes") as string) || null;
  } else {
    const body = (await req.json().catch(() => ({}))) as any;
    id = String(body.id || "");
    decision = String(body.decision || "");
    notes = body.notes ?? null;
  }

  if (!id || !["approve", "deny"].includes(decision)) {
    return NextResponse.redirect(new globalThis.URL("/admin/payouts?err=bad_request", process.env.SITE_URL), 303);
  }

  // Load payout
  const { data: row, error: loadErr } = await sb
    .from("landlord_payouts")
    .select("id, landlord_id, amount_cents, currency, status")
    .eq("id", id)
    .maybeSingle();

  if (loadErr || !row) {
    return NextResponse.redirect(new globalThis.URL("/admin/payouts?err=not_found", process.env.SITE_URL), 303);
  }
  if (row.status !== "pending") {
    return NextResponse.redirect(new globalThis.URL("/admin/payouts?err=already_decided", process.env.SITE_URL), 303);
  }

  const decided_at = new Date().toISOString();
  const nextStatus = decision === "approve" ? "approved" : "denied";

  // Update payout status
  const { error: upErr } = await sb
    .from("landlord_payouts")
    .update({ status: nextStatus, decided_at, decided_by: uid, notes })
    .eq("id", id);
  if (upErr) {
    return NextResponse.redirect(new globalThis.URL("/admin/payouts?err=update_failed", process.env.SITE_URL), 303);
  }

  // If approved, add a ledger debit entry
  if (nextStatus === "approved") {
    const { error: ledErr } = await sb.from("landlord_ledger").insert({
      landlord_id: row.landlord_id,
      payout_id: row.id,
      amount_cents: row.amount_cents,
      currency: row.currency || "PKR",
      type: "debit",
      source: "payout",
    });
    if (ledErr) {
      return NextResponse.redirect(new globalThis.URL("/admin/payouts?ok=1&err=ledger_warn", process.env.SITE_URL), 303);
    }
  }

  // Compute NEW BALANCE (credits - debits) for this landlord/currency
  const currency = row.currency || "PKR";
  const { data: ledgerRows, error: balErr } = await sb
    .from("landlord_ledger")
    .select("amount_cents, type")
    .eq("landlord_id", row.landlord_id)
    .eq("currency", currency)
    .limit(20000);

  let balanceCents = 0;
  if (!balErr && Array.isArray(ledgerRows)) {
    balanceCents = ledgerRows.reduce((acc: number, r: any) => {
      const amt = Number(r?.amount_cents || 0);
      return acc + (r?.type === "credit" ? amt : -amt);
    }, 0);
  }

  const url = new globalThis.URL("/admin/payouts", process.env.SITE_URL);
  url.searchParams.set("ok", "1");
  if (balanceCents) url.searchParams.set("bal", String(balanceCents));
  url.searchParams.set("cur", currency);

  return NextResponse.redirect(url, 303);
}
