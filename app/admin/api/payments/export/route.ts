// app/admin/api/payments/export/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { URL } from "url";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sbFromCookies() {
  const jar = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });
}

async function requireStaffOrAdmin() {
  const sb = sbFromCookies();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401 as const, sb };
  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["staff", "admin"].includes(String(me.role))) {
    return { ok: false as const, status: 403 as const, sb };
  }
  return { ok: true as const, sb };
}

export async function GET(req: Request) {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  const { sb } = guard;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const currency = url.searchParams.get("currency") || "";
  const q = url.searchParams.get("q") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  let query = sb
    .from("payments")
    .select(
      "id, invoice_id, tenant_id, amount_cents, currency, status, reference, created_at, confirmed_at"
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (currency) query = query.eq("currency", currency);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  if (q) query = query.ilike("reference", `%${q}%`);

  const { data, error } = await query.limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // fetch invoices for numbers
  const invoiceIds = Array.from(new Set((data || []).map((p) => p.invoice_id).filter(Boolean)));
  let invMap = new Map<string, { number: string | null }>();
  if (invoiceIds.length) {
    const { data: invoices } = await sb.from("invoices").select("id, number").in("id", invoiceIds);
    (invoices || []).forEach((inv) => invMap.set(inv.id, { number: inv.number }));
  }

  const header = [
    "payment_id",
    "invoice_id",
    "invoice_number",
    "tenant_id",
    "amount",
    "currency",
    "status",
    "reference",
    "created_at",
    "confirmed_at",
  ].join(",");

  const rows = (data || []).map((p) =>
    [
      p.id,
      p.invoice_id || "",
      invMap.get(p.invoice_id)?.number || "",
      p.tenant_id || "",
      (Number(p.amount_cents || 0) / 100).toFixed(2),
      p.currency,
      p.status,
      (p.reference || "").replace(/,/g, " "),
      p.created_at,
      p.confirmed_at || "",
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="payments.csv"`,
    },
  });
}
