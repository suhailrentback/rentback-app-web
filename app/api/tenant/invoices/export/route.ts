// app/api/tenant/invoices/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: Request) {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get: (n: string) => jar.get(n)?.value,
      set() {},
      remove() {},
    },
  });

  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = (url.searchParams.get("status") || "").trim().toUpperCase();

  let query = sb
    .from("invoices")
    .select("number, due_date, status, currency, amount_cents, created_at")
    .eq("tenant_id", uid)
    .order("created_at", { ascending: false });

  if (q) {
    // simple ilike on number/description (if description exists in table)
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (status && ["OPEN", "PAID", "OVERDUE", "DRAFT", "ISSUED"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = (data || []) as any[];
  const header = ["Invoice", "Due Date", "Status", "Currency", "Amount", "Created At"];
  const body = rows.map((r) => [
    r.number,
    r.due_date ? String(r.due_date).slice(0, 10) : "",
    r.status || "",
    (r.currency || "PKR").toUpperCase(),
    (Number(r.amount_cents || 0) / 100).toFixed(2),
    r.created_at ? new Date(r.created_at).toISOString() : "",
  ]);

  const csv =
    [header, ...body]
      .map((cols) => cols.map((c: any) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n") + "\n";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rentback_invoices.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
