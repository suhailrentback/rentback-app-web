// app/admin/api/rewards/ledger/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function sb() {
  const cs = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      get(n){ return cs.get(n)?.value; },
      set(n,v,o:CookieOptions){ cs.set({ name:n, value:v, ...o }); },
      remove(n,o:CookieOptions){ cs.set({ name:n, value:"", ...o }); },
    } }
  );
}

function toCsv(rows: any[]) {
  const cols = ["created_at","email","delta_points","source","reason","amount_cents","currency"];
  const head = cols.join(",");
  const body = rows.map(r =>
    cols.map(k => {
      const v = r[k] ?? "";
      const s = typeof v === "string" ? v : String(v);
      return `"${s.replaceAll(`"`, `""`)}"`;
    }).join(",")
  ).join("\n");
  return `${head}\n${body}\n`;
}

function normOne<T>(x: any): T | null { return Array.isArray(x) ? (x[0] ?? null) : (x ?? null); }

export async function GET(req: Request) {
  const supa = sb();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { data: prof } = await supa.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!prof || !["staff","admin"].includes((prof as any).role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new globalThis.URL(req.url);
  const q = url.searchParams.get("q") || "";
  const source = url.searchParams.get("source") || "";

  let query = supa
    .from("reward_ledger")
    .select("id,user_id,delta_points,reason,source,created_at,amount_cents,currency,profiles!inner(email)")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (source) query = query.eq("source", source);
  if (q) query = query.ilike("profiles.email", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r: any) => {
    const p = normOne<any>(r.profiles);
    return {
      created_at: r.created_at,
      email: p?.email ?? "",
      delta_points: r.delta_points,
      source: r.source,
      reason: r.reason,
      amount_cents: r.amount_cents ?? "",
      currency: r.currency ?? "",
    };
  });

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="reward_ledger.csv"`,
      "cache-control": "no-store",
    },
  });
}
