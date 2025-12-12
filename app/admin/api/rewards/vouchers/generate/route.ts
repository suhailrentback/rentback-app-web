// app/admin/api/rewards/vouchers/generate/route.ts
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

function rand(n = 8) {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i=0;i<n;i++) s += A[Math.floor(Math.random()*A.length)];
  return s;
}

export async function POST(req: Request) {
  const supa = sb();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.redirect(new globalThis.URL("/admin/rewards/vouchers?err=unauthenticated", req.url), 303);
  const { data: prof } = await supa.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!prof || !["staff","admin"].includes((prof as any).role)) {
    return NextResponse.redirect(new globalThis.URL("/admin/rewards/vouchers?err=forbidden", req.url), 303);
  }

  const form = await req.formData();
  const offerId = String(form.get("offer_id") || "");
  const prefix  = String(form.get("prefix") || "");
  const count   = Math.max(1, Math.min(5000, Number(form.get("count") || 0)));

  if (!offerId || !count) {
    return NextResponse.redirect(new globalThis.URL("/admin/rewards/vouchers?err=invalid", req.url), 303);
  }

  const rows = Array.from({ length: count }).map(() => ({
    offer_id: offerId,
    code: (prefix || "") + rand(10),
  }));

  const { error } = await supa.from("reward_vouchers").insert(rows);
  if (error) {
    const u = new globalThis.URL("/admin/rewards/vouchers", req.url);
    u.searchParams.set("err", "insert_failed");
    return NextResponse.redirect(u, 303);
  }

  const u = new globalThis.URL("/admin/rewards/vouchers", req.url);
  u.searchParams.set("ok", "1");
  return NextResponse.redirect(u, 303);
}
