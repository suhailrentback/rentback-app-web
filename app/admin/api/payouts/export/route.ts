// app/admin/api/payouts/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function sbFromCookies() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

async function getAuthedStaff() {
  const sb = sbFromCookies();
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user) return { ok: false as const, status: 401 };
  const { data: prof } = await sb.from("profiles").select("id, role").limit(1);
  const role = prof?.[0]?.role;
  if (role !== "staff" && role !== "admin") return { ok: false as const, status: 403 };
  return { ok: true as const, sb };
}

export async function GET(req: Request) {
  const guard = await getAuthedStaff();
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  const { sb } = guard;

  const url = new globalThis.URL(req.url);
  const status = url.searchParams.get("status") || "";
  const currency = url.searchParams.get("currency") || "";
  const q = url.searchParams.get("q") || "";

  let query = sb
    .from("landlord_payouts")
    .select("id, landlord_id, amount_cents, currency, status, requested_at, requested_by, decided_at, decided_by, notes")
    .order("requested_at", { ascending: false })
    .limit(2000);

  if (status && ["pending", "approved", "denied"].includes(status)) query = query.eq("status", status);
  if (currency) query = query.eq("currency", currency);
  if (q) query = query.or(`notes.ilike.%${q}%,landlord_id.eq.${q}`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data as any[]) || [];
  const header = [
    "id",
    "landlord_id",
    "amount",
    "currency",
    "status",
    "requested_at",
    "requested_by",
    "decided_at",
    "decided_by",
    "notes",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    const vals = [
      r.id,
      r.landlord_id,
      (Number(r.amount_cents || 0) / 100).toFixed(2),
      r.currency || "PKR",
      r.status,
      r.requested_at,
      r.requested_by || "",
      r.decided_at || "",
      r.decided_by || "",
      (r.notes || "").replaceAll('"', '""'),
    ];
    // simple CSV quoting for notes
    const escaped = vals.map((v, i) => (i === 9 ? `"${v}"` : String(v)));
    lines.push(escaped.join(","));
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="payouts.csv"`,
    },
  });
}
