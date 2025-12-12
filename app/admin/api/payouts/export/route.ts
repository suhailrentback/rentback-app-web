// app/admin/api/payouts/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

function toCsvValue(v: any) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const url = new globalThis.URL(req.url);
  const status = (url.searchParams.get("status") || "").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim();

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  let query = supabase
    .from("payout_requests")
    .select(
      "id, landlord_id, amount_cents, currency, status, notes, created_at, decided_by, decided_at"
    )
    .order("created_at", { ascending: false });

  if (["pending", "approved", "denied"].includes(status)) {
    query = query.eq("status", status);
  }
  if (q) {
    query = query.ilike("notes", `%${q}%`);
  }

  const { data, error } = await query.limit(1000);

  if (error) {
    return NextResponse.json({ error: "load_failed", detail: error.message }, { status: 500 });
  }

  const rows = Array.isArray(data) ? data : [];
  const header = [
    "id",
    "landlord_id",
    "amount_cents",
    "currency",
    "status",
    "notes",
    "created_at",
    "decided_by",
    "decided_at",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.landlord_id,
        r.amount_cents,
        r.currency || "EUR",
        r.status,
        r.notes || "",
        r.created_at,
        r.decided_by || "",
        r.decided_at || "",
      ]
        .map(toCsvValue)
        .join(",")
    );
  }

  const csv = lines.join("\n");
  const res = new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="payout_requests.csv"`,
      "cache-control": "no-store",
    },
  });
  return res;
}
