// app/admin/api/payouts/decide/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email";

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

function fmtMoney(cents: number, currency = "PKR") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format((cents || 0) / 100);
  } catch {
    return `${(cents || 0) / 100} ${currency}`;
  }
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
  const { data: payout, error: loadErr } = await sb
    .from("landlord_payouts")
    .select("id, landlord_id, amount_cents, currency, status")
    .eq("id", id)
    .maybeSingle();

  if (loadErr || !payout) {
    return NextResponse.redirect(new globalThis.URL("/admin/payouts?err=not_found", process.env.SITE_URL), 303);
  }
  if (payout.status !== "pending") {
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
    await sb.from("landlord_ledger").insert({
      landlord_id: payout.landlord_id,
      payout_id: payout.id,
      amount_cents: payout.amount_cents,
      currency: payout.currency || "PKR",
      type: "debit",
      source: "payout",
    });
  }

  // Compute NEW BALANCE for toast
  const currency = payout.currency || "PKR";
  const { data: ledgerRows } = await sb
    .from("landlord_ledger")
    .select("amount_cents, type")
    .eq("landlord_id", payout.landlord_id)
    .eq("currency", currency)
    .limit(20000);

  let balanceCents = 0;
  if (Array.isArray(ledgerRows)) {
    balanceCents = ledgerRows.reduce((acc: number, r: any) => {
      const amt = Number(r?.amount_cents || 0);
      return acc + (r?.type === "credit" ? amt : -amt);
    }, 0);
  }

  // Fetch landlord email
  const { data: landlord } = await sb
    .from("profiles")
    .select("email, full_name")
    .eq("id", payout.landlord_id)
    .maybeSingle();

  const to = landlord?.email || "";
  const amountStr = fmtMoney(Number(payout.amount_cents || 0), currency);
  const statusWord = nextStatus === "approved" ? "APPROVED" : "DENIED";

  // Compose email (no-op if keys missing)
  if (to.includes("@")) {
    const site = process.env.SITE_URL || "https://www.rentback.app";
    const subject = `Payout ${statusWord}: ${amountStr}`;
    const text = [
      `Hello${landlord?.full_name ? " " + landlord.full_name : ""},`,
      ``,
      `Your payout request (${payout.id}) has been ${statusWord.toLowerCase()}.`,
      `Amount: ${amountStr}`,
      `Currency: ${currency}`,
      ``,
      nextStatus === "approved"
        ? `Funds will be processed per your payout method on file.`
        : `If you believe this was in error, reply to this email or contact support.`,
      ``,
      `Current balance: ${fmtMoney(balanceCents, currency)}`,
      ``,
      `You can review details anytime at ${site}/admin/payouts (staff view) or in your landlord dashboard when available.`,
      ``,
      `— RentBack`,
    ].join("\n");

    await sendEmail({ to, subject, text });
  }

  const url = new globalThis.URL("/admin/payouts", process.env.SITE_URL);
  url.searchParams.set("ok", "1");
  if (balanceCents) url.searchParams.set("bal", String(balanceCents));
  url.searchParams.set("cur", currency);

  return NextResponse.redirect(url, 303);
}
