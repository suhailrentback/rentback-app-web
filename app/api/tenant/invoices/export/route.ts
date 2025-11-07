// app/api/tenant/invoices/export/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_STATUS = new Set(["open", "issued", "paid", "overdue", "void"]);
const SORT_MAP: Record<
  string,
  { col: "issued_at" | "due_date" | "total_amount"; asc: boolean }
> = {
  issued_desc: { col: "issued_at", asc: false },
  issued_asc: { col: "issued_at", asc: true },
  due_desc: { col: "due_date", asc: false },
  due_asc: { col: "due_date", asc: true },
  amount_desc: { col: "total_amount", asc: false },
  amount_asc: { col: "total_amount", asc: true },
};

function dateOnly(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  // ISO yyyy-mm-dd
  return dt.toISOString().slice(0, 10);
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Escape " by doubling it, wrap field in quotes if it contains comma/quote/newline
  const needsWrap = /[",\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsWrap ? `"${escaped}"` : escaped;
}

export async function GET(req: Request) {
  const supabase = createRouteSupabase();
  const url = new URL(req.url);
  const sp = url.searchParams;

  const q = (sp.get("q") || "").trim();
  const statusRaw = (sp.get("status") || "").toLowerCase();
  const status = ALLOWED_STATUS.has(statusRaw) ? statusRaw : "";
  const cur = (sp.get("cur") || "").toUpperCase();
  const issuedFrom = sp.get("from_date") || "";
  const issuedTo = sp.get("to_date") || "";
  const sortKey = sp.get("sort") || "issued_desc";
  const sort = SORT_MAP[sortKey] ?? SORT_MAP["issued_desc"];

  // Build filtered query (RLS will scope to the logged-in tenant)
  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, total_amount, currency, description, issued_at, due_date",
      { count: "exact" }
    );

  if (status) query = query.eq("status", status);
  if (cur) query = query.eq("currency", cur);
  if (issuedFrom) query = query.gte("issued_at", issuedFrom);
  if (issuedTo) query = query.lte("issued_at", issuedTo);

  if (q) {
    const like = `%${q}%`;
    // Search by number/description (ilike)
    query = query.or(`number.ilike.${like},description.ilike.${like}` as any);
  }

  // Export up to 5000 rows to be safe
  const MAX_ROWS = 5000;
  query = query.order(sort.col, { ascending: sort.asc }).range(0, MAX_ROWS - 1);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
    // (We keep the error generic to avoid leaking internal details)
  }

  const rows = data ?? [];
  const header = [
    "invoice_id",
    "invoice_number",
    "status",
    "total_amount",
    "currency",
    "issued_date",
    "due_date",
    "description",
  ];

  const body = rows
    .map((r) => {
      const amt =
        typeof r.total_amount === "number" ? r.total_amount : Number(r.total_amount) || 0;
      return [
        csvEscape(r.id),
        csvEscape(r.number ?? ""),
        csvEscape((r.status ?? "").toString().toUpperCase()),
        csvEscape(amt),
        csvEscape(r.currency ?? ""),
        csvEscape(dateOnly(r.issued_at)),
        csvEscape(dateOnly(r.due_date)),
        csvEscape(r.description ?? ""),
      ].join(",");
    })
    .join("\n");

  const csv = `${header.join(",")}\n${body}`;
  const filename = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
