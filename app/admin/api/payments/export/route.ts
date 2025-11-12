// app/admin/api/payments/export/route.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvEscape(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(_req: Request) {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  // Guard: only staff/admin can export
  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("role, email")
    .single();

  if (meErr || !me || !["staff", "admin"].includes(String(me.role))) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      id, amount_cents, currency, status, reference, created_at, confirmed_at,
      invoice:invoices!payments_invoice_id_fkey ( id, number, due_date )
    `
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return new Response(JSON.stringify({ error: "select_failed", detail: error.message }), { status: 500 });
  }

  const rows = (data ?? []).map((d: any) => {
    const inv = Array.isArray(d.invoice) ? (d.invoice[0] ?? null) : d.invoice ?? null;
    return {
      id: d.id ?? "",
      amount_cents: d.amount_cents ?? "",
      currency: d.currency ?? "",
      status: d.status ?? "",
      reference: d.reference ?? "",
      created_at: d.created_at ?? "",
      confirmed_at: d.confirmed_at ?? "",
      invoice_id: inv?.id ?? "",
      invoice_number: inv?.number ?? "",
      invoice_due_date: inv?.due_date ?? "",
    };
  });

  const header = [
    "payment_id",
    "amount_cents",
    "currency",
    "status",
    "reference",
    "created_at",
    "confirmed_at",
    "invoice_id",
    "invoice_number",
    "invoice_due_date",
  ];

  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.amount_cents,
        r.currency,
        r.status,
        r.reference,
        r.created_at,
        r.confirmed_at,
        r.invoice_id,
        r.invoice_number,
        r.invoice_due_date,
      ].map(csvEscape).join(",")
    ),
  ].join("\n");

  const filename = `payments_export_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
