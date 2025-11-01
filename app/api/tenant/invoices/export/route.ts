// app/api/tenant/invoices/export/route.ts
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Match the UI’s filters
const SearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : [])),
  issued_from: z.string().optional(),
  issued_to: z.string().optional(),
  due_from: z.string().optional(),
  due_to: z.string().optional(),
  min_amount: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || Number.isFinite(v!), {
      message: "min_amount must be a number",
    }),
  max_amount: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || Number.isFinite(v!), {
      message: "max_amount must be a number",
    }),
  sort: z
    .enum(["issued_at", "due_date", "total_amount", "number", "status"])
    .optional()
    .default("issued_at"),
  dir: z.enum(["asc", "desc"]).optional().default("desc"),
});

// CSV helper
function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  // Collect query params (including repeated keys like ?status=open&status=paid)
  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);
  const map = new Map<string, string[]>();
  params.forEach((val, key) => {
    const arr = map.get(key) ?? [];
    arr.push(val);
    map.set(key, arr);
  });
  const raw: Record<string, string | string[]> = {};
  for (const [k, arr] of map.entries()) raw[k] = arr.length > 1 ? arr : arr[0];

  const parsed = SearchSchema.safeParse(raw);
  const sp = parsed.success ? parsed.data : SearchSchema.parse({});

  const supabase = createRouteSupabase();

  let query = supabase
    .from("invoices")
    .select(
      "id, number, description, status, total_amount, currency, issued_at, due_date",
      { count: "exact" }
    );

  if (sp.q && sp.q.length > 0) {
    query = query.or(`number.ilike.%${sp.q}%,description.ilike.%${sp.q}%`);
  }

  if (sp.status.length > 0) {
    const allowed = new Set(["open", "issued", "paid", "overdue"]);
    const wanted = sp.status
      .map((s) => String(s).toLowerCase())
      .filter((s) => allowed.has(s));
    if (wanted.length > 0) {
      query = query.in("status", wanted);
    }
  }

  if (sp.min_amount !== undefined) query = query.gte("total_amount", sp.min_amount);
  if (sp.max_amount !== undefined) query = query.lte("total_amount", sp.max_amount);

  if (sp.issued_from) query = query.gte("issued_at", sp.issued_from);
  if (sp.issued_to) query = query.lte("issued_at", sp.issued_to);
  if (sp.due_from) query = query.gte("due_date", sp.due_from);
  if (sp.due_to) query = query.lte("due_date", sp.due_to);

  query = query.order(sp.sort, { ascending: sp.dir === "asc" });

  // Cap export size (server-safe)
  const MAX_ROWS = 2000;
  const { data, error } = await query.range(0, MAX_ROWS - 1);

  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed to export CSV" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const rows = data ?? [];
  const headers = [
    "id",
    "number",
    "description",
    "status",
    "total_amount",
    "currency",
    "issued_at",
    "due_date",
  ];

  const lines = [
    headers.join(","), // header row
    ...rows.map((r) => {
      const issued = r.issued_at ? new Date(r.issued_at).toISOString() : "";
      const due = r.due_date ? new Date(r.due_date).toISOString() : "";
      return [
        csvEscape(r.id),
        csvEscape(r.number ?? ""),
        csvEscape(r.description ?? ""),
        csvEscape(r.status ?? ""),
        csvEscape(typeof r.total_amount === "number" ? r.total_amount : ""),
        csvEscape(r.currency ?? ""),
        csvEscape(issued),
        csvEscape(due),
      ].join(",");
    }),
  ];

  const csv = lines.join("\n");
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${yyyymmdd}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
