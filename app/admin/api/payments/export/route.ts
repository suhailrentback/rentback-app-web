// app/admin/api/payments/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  const jar = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });
}

async function requireStaffOrAdmin() {
  const sb = getClient();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401 as const, error: "unauthorized" };

  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["staff", "admin"].includes(String(me.role))) {
    return { ok: false as const, status: 403 as const, error: "forbidden" };
  }
  return { ok: true as const, sb };
}

export async function GET(req: Request) {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { sb } = guard;

  // Use the global URL constructor explicitly to avoid any shadowing.
  const url = new (globalThis as any).URL(req.url);
  const status = url.searchParams.get("status") || "";
  const currency = url.searchParams.get("currency") || "";
  const q = url.searchParams.get("q") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  let query = sb
    .from("payments")
    .select(
      "id, amount_cents, currency, status, reference, created_at, confirmed_at, invoice:invoices(id, number, due_date)"
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  if (status) query = query.eq("status", status);
  if (currency) query = query.eq("currency", currency);
  if (q) query = query.ilike("reference", `%${q}%`);
  if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59Z`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = Array.isArray(data) ? data : [];
  const header = [
    "payment_id",
    "amount_cents",
    "amount",
    "currency",
    "status",
    "reference",
    "created_at",
    "confirmed_at",
    "invoice_id",
    "invoice_number",
    "invoice_due_date",
  ].join(",");

  const lines = rows.map((r: any) => {
    const inv = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice;
    const amount = ((Number(r.amount_cents ?? 0) || 0) / 100).toFixed(2);
    const vals = [
      r.id ?? "",
      r.amount_cents ?? "",
      amount,
      r.currency ?? "",
      r.status ?? "",
      String(r.reference ?? "").replaceAll(",", " "),
      r.created_at ?? "",
      r.confirmed_at ?? "",
      inv?.id ?? "",
      String(inv?.number ?? "").replaceAll(",", " "),
      inv?.due_date ?? "",
    ];
    return vals.join(",");
  });

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments.csv"',
    },
  });
}
