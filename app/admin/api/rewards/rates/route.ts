// app/admin/api/rewards/rates/route.ts
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

export async function POST(req: Request) {
  const supa = sb();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { data: prof } = await supa.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!prof || !["staff","admin"].includes((prof as any).role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const currency = String(form.get("currency") || "").trim().toUpperCase();
  const points = Math.max(0, Number(form.get("points_per_100_cents") || 0));
  const active = !!(form.get("is_active") === "on");

  if (!currency) {
    return NextResponse.json({ error: "invalid_currency" }, { status: 400 });
  }

  // upsert by currency (active)
  const { error } = await supa
    .from("reward_rates")
    .upsert({
      currency,
      points_per_100_cents: points,
      is_active: active,
      updated_at: new Date().toISOString(),
    }, { onConflict: "currency" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new globalThis.URL("/admin/rewards/rates", req.url), 303);
}
