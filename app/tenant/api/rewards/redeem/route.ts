// app/tenant/api/rewards/redeem/route.ts
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
  if (!user) return NextResponse.redirect(new globalThis.URL("/tenant/rewards?err=unauthenticated", req.url), 303);

  const ct = req.headers.get("content-type") || "";
  const form = ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")
    ? await req.formData()
    : null;
  const offerId = form ? String(form.get("offer_id") || "") : "";

  if (!offerId) {
    return NextResponse.redirect(new globalThis.URL("/tenant/rewards?err=missing_offer", req.url), 303);
  }

  const { data, error } = await supa.rpc("redeem_offer", { p_offer_id: offerId });
  if (error) {
    const safe = encodeURIComponent(error.message || "redeem_failed");
    return NextResponse.redirect(new globalThis.URL(`/tenant/rewards?err=${safe}`, req.url), 303);
  }

  return NextResponse.redirect(new globalThis.URL("/tenant/rewards?ok=1", req.url), 303);
}
