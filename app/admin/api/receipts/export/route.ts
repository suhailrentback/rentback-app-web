// app/admin/api/receipts/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function csvEscape(s: string) {
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(URL, ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  // Gate: only staff/admin
  const { data: meRes } = await supabase.auth.getUser();
  const uid = meRes?.user?.id;
  if (!uid) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", uid)
    .maybeSingle();

  if (!myProfile || !["staff", "admin"].includes(String(myProfile.role))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Pull recent (you can widen as needed)
  const { data: recs } = await supabase
    .from("receipts")
    .select("id, created_at, amount_cents, currency, invoice_id, payment_id, tenant_id")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = Array.isArray(recs) ? recs : [];

  // Hydrate related maps
  const invIds = [...new Set(rows.map(r => r.invoice_id).filter(Boolean))] as string[];
  const payIds = [...new Set(rows.map(r => r.payment_id).filter(Boolean))] as string[];
  const tenIds = [...new Set(rows.map(r => r.tenant_id).filter(Boolean))] as string[];

  const [invQ, payQ, tenQ] = await Promise.all([
    invIds.length
      ? supabase.from("invoices").select("id, number, due_date").in("id", invIds)
      : Promise.resolve({ data: [] as any[] }),
    payIds.length
      ? supabase.from("payments").select("id, reference, status").in("id", payIds)
      : Promise.resolve({ data: [] as any[] }),
    tenIds.length
      ? supabase.from("profiles").select("user_id, email").in("user_id", tenIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const invMap = new Map<string, { number: string | null; due_date: string | null }>();
  for (const r of (invQ.data as any[]) ?? []) {
    invMap.set(String(r.id), { number: r.number ?? null, due_date: r.due_date ?? null });
  }

  const payMap = new Map<string, { reference: string | null; status: string | null }>();
  for (const r of (payQ.data as any[]) ?? []) {
    payMap.set(String(r.id), { reference: r.reference ?? null, status: r.status ?? null });
  }

  const tenMap = new Map<string, string | null>();
  for (const r of (tenQ.data as any[]) ?? []) {
    tenMap.set(String(r.user_id), r.email ?? null);
  }

  const header = [
    "receipt_id",
    "created_at",
    "amount",
    "currency",
    "invoice_id",
    "invoice_number",
    "invoice_due",
    "payment_id",
    "payment_reference",
    "payment_status",
    "tenant_id",
    "tenant_email",
  ].join(",");

  const lines = [header];

  for (const r of rows) {
    const inv = r.invoice_id ? invMap.get(String(r.invoice_id)) : undefined;
    const pay = r.payment_id ? payMap.get(String(r.payment_id)) : undefined;
    const tenantEmail = r.tenant_id ? tenMap.get(String(r.tenant_id)) : null;

    const amountFloat = typeof r.amount_cents === "number" ? (r.amount_cents / 100).toFixed(2) : "0.00";

    const line = [
      csvEscape(String(r.id)),
      csvEscape(String(r.created_at)),
      csvEscape(amountFloat),
      csvEscape(String(r.currency || "PKR")),
      csvEscape(String(r.invoice_id || "")),
      csvEscape(String(inv?.number ?? "")),
      csvEscape(String(inv?.due_date ?? "")),
      csvEscape(String(r.payment_id || "")),
      csvEscape(String(pay?.reference ?? "")),
      csvEscape(String(pay?.status ?? "")),
      csvEscape(String(r.tenant_id || "")),
      csvEscape(String(tenantEmail ?? "")),
    ].join(",");

    lines.push(line);
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="receipts_export.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
