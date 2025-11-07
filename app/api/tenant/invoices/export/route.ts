// app/api/tenant/invoices/export/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  number: string | null;
  description: string | null;
  status: string | null;
  total_amount: number | null;
  amount_cents: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
};

const ALLOWED_SORT = ["issued_at", "due_date"] as const;

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  // Quote if contains comma, quote, or newline. Double-up inner quotes.
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const supabase = createRouteSupabase();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const st = (url.searchParams.get("st") || "").trim().toLowerCase();
  const sortRaw = (url.searchParams.get("sort") || "issued_at").trim();
  const sort = (ALLOWED_SORT as readonly string[]).includes(sortRaw) ? sortRaw : "issued_at";
  const dir = (url.searchParams.get("dir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  // Build query (RLS will scope to the logged-in tenant)
  let query = supabase
    .from("invoices")
    .select(
      "id, number, description, status, total_amount, amount_cents, currency, issued_at, due_date"
    )
    .order(sort, { ascending: dir === "asc" })
    .range(0, 4999); // export up to 5k rows safely

  if (q) {
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (st) {
    query = query.eq("status", st);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];

  const header = [
    "Invoice ID",
    "Number",
    "Description",
    "Status",
    "Amount",
    "Currency",
    "Issued",
    "Due",
  ];

  const lines = [header.map(csvEscape).join(",")];

  for (const r of rows) {
    const amount =
      typeof r.total_amount === "number"
        ? r.total_amount
        : typeof r.amount_cents === "number"
        ? Math.round(r.amount_cents) / 100
        : 0;

    lines.push(
      [
        r.id,
        r.number ?? "",
        r.description ?? "",
        (r.status ?? "").toUpperCase(),
        amount,
        (r.currency ?? "PKR").toUpperCase(),
        r.issued_at ? new Date(r.issued_at).toISOString() : "",
        r.due_date ? new Date(r.due_date).toISOString() : "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = lines.join("\n");
  const ymd = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${ymd}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
