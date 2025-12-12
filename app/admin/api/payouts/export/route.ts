// app/admin/api/payouts/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function ensureStaff(sb: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await (await sb).auth.getUser();
  if (!user) return { ok: false as const, reason: "not_authenticated" };

  const { data: prof } = await (await sb)
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const role = (prof?.role || "").toLowerCase();
  if (role !== "staff" && role !== "admin") return { ok: false as const, reason: "forbidden" };
  return { ok: true as const };
}

function toCSV(rows: any[]) {
  const header = [
    "id",
    "landlord_id",
    "amount_cents",
    "currency",
    "status",
    "requested_at",
    "decided_at",
    "decided_by",
    "note",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const vals = header.map((k) => {
      const v = r?.[k];
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    });
    lines.push(vals.join(","));
  }
  return lines.join("\n");
}

export async function GET(req: Request) {
  const sb = createClient(cookies());
  const gate = await ensureStaff(sb);
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const url = new globalThis.URL(req.url);
  const status = url.searchParams.get("status") || undefined;

  let q = (await sb)
    .from("payout_requests")
    .select(
      "id, landlord_id, amount_cents, currency, status, requested_at, decided_at, decided_by, note"
    )
    .order("requested_at", { ascending: false });

  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = toCSV(data || []);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="payouts_${Date.now()}.csv"`,
    },
  });
}
