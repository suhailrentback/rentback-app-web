// app/admin/api/reconciliation/export/route.ts
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
  if (!userRes?.user) return { ok: false as const, status: 401 as const, msg: "unauthorized" as const };
  const { data: me } = await sb
    .from("profiles")
    .select("id, role")
    .eq("id", userRes.user.id)
    .maybeSingle();
  if (!me || (me.role !== "staff" && me.role !== "admin")) {
    return { ok: false as const, status: 403 as const, msg: "forbidden" as const };
  }
  return { ok: true as const, sb };
}

function csvEscape(v: any): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fmtMoneyCents(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format((cents || 0) / 100);
  } catch {
    return `${(cents || 0) / 100} ${currency}`;
  }
}

export async function GET(req: Request) {
  const guard = await getAuthedStaff();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.msg }, { status: guard.status });
  }
  const { sb } = guard;

  const url = new globalThis.URL(req.url);
  const landlordId = url.searchParams.get("landlordId") || "";
  const landlordEmail = url.searchParams.get("landlordEmail") || "";
  const currency = url.searchParams.get("currency") || ""; // optional
  const dateFrom = url.searchParams.get("dateFrom") || ""; // YYYY-MM-DD
  const dateTo = url.searchParams.get("dateTo") || "";     // YYYY-MM-DD

  let resolvedLandlordId = landlordId;

  // If email provided, resolve to landlord id
  if (!resolvedLandlordId && landlordEmail) {
    const { data: landlord } = await sb
      .from("profiles")
      .select("id, email")
      .eq("email", landlordEmail)
      .maybeSingle();
    if (landlord?.id) resolvedLandlordId = landlord.id as string;
  }

  // Build query
  let q = sb
    .from("landlord_ledger")
    .select("id, landlord_id, amount_cents, currency, type, source, payment_id, payout_id, created_at")
    .order("created_at", { ascending: true });

  if (resolvedLandlordId) q = q.eq("landlord_id", resolvedLandlordId);
  if (currency) q = q.eq("currency", currency);
  if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59.999Z`);

  const { data: rows, error } = await q.limit(200000);
  if (error) {
    return NextResponse.json({ error: "query_failed", detail: error.message }, { status: 500 });
  }

  const ledger = (rows as any[]) || [];

  // Prefetch landlord emails for CSV (optional, best-effort)
  const landlordIds = Array.from(new Set(ledger.map((r) => r.landlord_id).filter(Boolean)));
  let emailByLandlord: Record<string, string> = {};
  if (landlordIds.length) {
    const { data: landlords } = await sb
      .from("profiles")
      .select("id, email")
      .in("id", landlordIds);
    if (Array.isArray(landlords)) {
      emailByLandlord = landlords.reduce((acc: Record<string, string>, r: any) => {
        acc[r.id] = r.email || "";
        return acc;
      }, {});
    }
  }

  // Running balance per landlord+currency
  const balance: Record<string, number> = {};
  const lines: string[] = [];
  const header = [
    "date",
    "landlord_id",
    "landlord_email",
    "type",
    "source",
    "amount_cents",
    "amount_formatted",
    "currency",
    "running_balance_cents",
    "running_balance_formatted",
    "payment_id",
    "payout_id",
    "ledger_id",
  ].join(",");

  lines.push(header);

  for (const r of ledger) {
    const cur = r.currency || "PKR";
    const key = `${r.landlord_id}|${cur}`;
    const cents = Number(r.amount_cents || 0);
    if (!balance[key]) balance[key] = 0;
    balance[key] += r.type === "credit" ? cents : -cents;

    const landlordEmailOut = emailByLandlord[r.landlord_id] || "";
    const row = [
      csvEscape(new Date(r.created_at).toISOString()),
      csvEscape(r.landlord_id),
      csvEscape(landlordEmailOut),
      csvEscape(r.type),
      csvEscape(r.source || ""),
      csvEscape(String(cents)),
      csvEscape(fmtMoneyCents(cents, cur)),
      csvEscape(cur),
      csvEscape(String(balance[key])),
      csvEscape(fmtMoneyCents(balance[key], cur)),
      csvEscape(r.payment_id || ""),
      csvEscape(r.payout_id || ""),
      csvEscape(r.id),
    ].join(",");
    lines.push(row);
  }

  const csv = lines.join("\n");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `reconciliation-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
