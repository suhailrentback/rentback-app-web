import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function toCsv(rows: any[]) {
  const headers = ["created_at","entry_type","reference_type","reference_id","amount_cents","notes"];
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map(r =>
      [
        r.created_at ?? "",
        r.entry_type ?? "",
        r.reference_type ?? "",
        r.reference_id ?? "",
        r.amount_cents ?? 0,
        r.notes ?? "",
      ].map(escape).join(",")
    ),
  ];
  return lines.join("\n");
}

export async function GET(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("v_landlord_ledger_enriched")
    .select("created_at, entry_type, reference_type, reference_id, amount_cents, notes")
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return new Response(`error: ${error.message}`, { status: 500 });
  }

  const csv = toCsv(Array.isArray(data) ? data : []);
  const filename = `ledger_${new Date().toISOString().slice(0,10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
