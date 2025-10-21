// app/api/tenant/invoices/export/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // wrap in quotes if it has comma, quote, or newline
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const supabase = createRouteSupabase();
  const url = new URL(req.url);
  const sp = url.searchParams;

  // Auth + role check
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!prof || String(prof.role) !== "tenant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Filters (mirror the list page)
  const q = (sp.get("q") ?? "").trim();
  const status = (sp.get("status") ?? "").trim().toLowerCase();
  const issued_from = sp.get("issued_from") ?? "";
  const issued_to = sp.get("issued_to") ?? "";
  const due_from = sp.get("due_from") ?? "";
  const due_to = sp.get("due_to") ?? "";
  const min = Number(sp.get("min"));
  const max = Number(sp.get("max"));

  // Build query
  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, currency, description"
    )
    .eq("tenant_id", user.id);

  if (status && ["open", "paid", "void"].includes(status)) {
    query = query.eq("status", status);
  }
  if (q) {
    const like = `%${q}%`;
    query = query.or(`number.ilike.${like},description.ilike.${like}`);
  }
  if (issued_from) query = query.gte("issued_at", new Date(issued_from).toISOString());
  if (issued_to) query = query.lte("issued_at", new Date(issued_to).toISOString());
  if (due_from) query = query.gte("due_date", new Date(due_from).toISOString());
  if (due_to) query = query.lte("due_date", new Date(due_to).toISOString());
  if (!Number.isNaN(min)) query = query.gte("total_amount", min);
  if (!Number.isNaN(max)) query = query.lte("total_amount", max);

  // Stable order; export all rows (no pagination here)
  query = query.order("issued_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = (data ?? []) as any[];

  // Build CSV
  const headers = [
    "id",
    "number",
    "status",
    "issued_at",
    "due_date",
    "total_amount",
    "currency",
    "description",
  ];
  const lines: string[] = [];
  lines.push(headers.join(","));
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.id),
        csvEscape(r.number ?? ""),
        csvEscape(r.status ?? ""),
        csvEscape(r.issued_at ?? ""),
        csvEscape(r.due_date ?? ""),
        csvEscape(typeof r.total_amount === "number" ? r.total_amount : ""),
        csvEscape((r.currency ?? "").toUpperCase()),
        csvEscape(r.description ?? ""),
      ].join(",")
    );
  }
  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
