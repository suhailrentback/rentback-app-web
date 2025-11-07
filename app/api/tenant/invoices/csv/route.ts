// app/api/tenant/invoices/csv/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

function toISODate(s?: string | null) {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

export async function GET(req: Request) {
  const supabase = createRouteSupabase();

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = (url.searchParams.get("status") ?? "").trim().toLowerCase();
  const issued_from = (url.searchParams.get("issued_from") ?? "").trim();
  const issued_to = (url.searchParams.get("issued_to") ?? "").trim();
  const sort = url.searchParams.get("sort") ?? "issued_desc";

  // Build query mirroring the Tenant list page (RLS scopes to current tenant)
  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, total_amount, currency, due_date, issued_at, description",
      { count: "exact" }
    );

  if (q) {
    const clean = q.replace(/%/g, "");
    query = query.or(`number.ilike.%${clean}%,description.ilike.%${clean}%`);
  }

  const STATUS_OPTIONS = new Set(["issued", "paid", "overdue", "open"]);
  if (status && STATUS_OPTIONS.has(status)) {
    query = query.eq("status", status);
  }

  if (issued_from) {
    const iso = new Date(issued_from).toISOString();
    query = query.gte("issued_at", iso);
  }
  if (issued_to) {
    const end = new Date(issued_to);
    end.setHours(23, 59, 59, 999);
    query = query.lte("issued_at", end.toISOString());
  }

  switch (sort) {
    case "issued_asc":
      query = query.order("issued_at", { ascending: true, nullsFirst: true });
      break;
    case "issued_desc":
      query = query.order("issued_at", { ascending: false, nullsFirst: true });
      break;
    case "due_asc":
      query = query.order("due_date", { ascending: true, nullsFirst: true });
      break;
    case "due_desc":
      query = query.order("due_date", { ascending: false, nullsFirst: true });
      break;
    case "amount_asc":
      query = query.order("total_amount", { ascending: true, nullsFirst: true });
      break;
    case "amount_desc":
      query = query.order("total_amount", { ascending: false, nullsFirst: true });
      break;
    default:
      query = query.order("issued_at", { ascending: false, nullsFirst: true });
  }

  // Cap export to 1000 rows for safety
  query = query.range(0, 999);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const rows = (data ?? []) as any[];

  // CSV header
  const header = [
    "id",
    "number",
    "status",
    "total_amount",
    "currency",
    "issued_at",
    "due_date",
    "description",
  ];

  const lines = [header.join(",")];

  for (const r of rows) {
    const line = [
      r.id ?? "",
      r.number ?? "",
      r.status ?? "",
      typeof r.total_amount === "number" ? r.total_amount : "",
      (r.currency ?? "").toString().toUpperCase(),
      toISODate(r.issued_at),
      toISODate(r.due_date),
      (r.description ?? "").toString().replace(/"/g, '""'),
    ].map((cell) => {
      // simple CSV escaping: wrap if contains comma/quote/newline
      const s = String(cell);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    });

    lines.push(line.join(","));
  }

  const csv = "\uFEFF" + lines.join("\n"); // add BOM for Excel
  const ts = new Date();
  const name =
    `invoices-${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, "0")}${String(
      ts.getDate()
    ).padStart(2, "0")}-${String(ts.getHours()).padStart(2, "0")}${String(
      ts.getMinutes()
    ).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
