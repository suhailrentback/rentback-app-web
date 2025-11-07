// app/api/tenant/invoices/export/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Only allow sorting by these columns to avoid SQL injection via query params
const ALLOWED_SORT = new Set([
  "issued_at",
  "due_date",
  "total_amount",
  "number",
  "status",
]);

function toInt(input: string | null, def: number, min: number, max: number) {
  const n = Number.parseInt(String(input ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function csvEscape(val: unknown) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const supabase = createRouteSupabase();
  const url = new URL(req.url);
  const sp = url.searchParams;

  const q = sp.get("q")?.trim() || "";
  const status = sp.get("status")?.trim().toLowerCase() || "";
  const sortParam = (sp.get("sort") || "issued_at").trim();
  const sort = ALLOWED_SORT.has(sortParam) ? sortParam : "issued_at";
  const dir = sp.get("dir") === "asc" ? "asc" : "desc";

  // Large default to export “everything in view” without pagination surprises
  const page = toInt(sp.get("page"), 1, 1, 1000000);
  const per = toInt(sp.get("per"), 2000, 1, 5000);
  const from = (page - 1) * per;
  const to = from + per - 1;

  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, amount_cents, currency, description",
      { count: "exact" }
    )
    .order(sort as any, { ascending: dir === "asc", nullsFirst: true })
    .range(from, to);

  if (status && ["open", "paid", "overdue", "issued", "draft", "unpaid"].includes(status)) {
    query = query.eq("status", status);
  }

  if (q) {
    // Search by number OR description
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = "id,number,status,issued_at,due_date,total_amount,currency,description";
  const rows = (data ?? []).map((row: any) => {
    const total =
      typeof row.total_amount === "number"
        ? row.total_amount
        : typeof row.amount_cents === "number"
        ? Math.round(row.amount_cents) / 100
        : "";
    return [
      row.id,
      row.number ?? "",
      String(row.status ?? "").toUpperCase(),
      row.issued_at ?? "",
      row.due_date ?? "",
      total,
      (row.currency ?? "").toUpperCase(),
      row.description ?? "",
    ]
      .map(csvEscape)
      .join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tenant-invoices.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
