// app/api/landlord/invoices/export/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  number: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
  description: string | null;
};

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const ALLOWED_STATUS = new Set(["draft", "open", "issued", "paid", "overdue"]);

export async function GET(req: Request) {
  const supabase = createRouteSupabase();
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const statusRaw = (url.searchParams.get("status") || "").toLowerCase();
  const status = ALLOWED_STATUS.has(statusRaw) ? statusRaw : "";

  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, total_amount, currency, issued_at, due_date, description"
    )
    .order("issued_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }

  const rows: Row[] = Array.isArray(data) ? (data as Row[]) : [];

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

  const body = rows
    .map((r) =>
      [
        r.id,
        r.number ?? "",
        (r.status ?? "").toUpperCase(),
        typeof r.total_amount === "number" ? r.total_amount : "",
        (r.currency ?? "PKR").toUpperCase(),
        r.issued_at ?? "",
        r.due_date ?? "",
        r.description ?? "",
      ]
        .map(csvEscape)
        .join(",")
    )
    .join("\n");

  const csv = [header.join(","), body].join("\n");
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const filename = `landlord-invoices-${y}${m}${d}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
