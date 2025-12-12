// app/api/rewards/redeem/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function redirectWith(query: Record<string, string>) {
  const url = new globalThis.URL("/tenant/rewards", process.env.SITE_URL);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    const offerId = (form?.get("offerId") as string) || "";

    if (!offerId) {
      return redirectWith({ err: "missing_offer" });
    }

    const sb = await createClient(cookies());
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return redirectWith({ err: "not_authenticated" });

    const { data, error } = await sb.rpc("rpc_redeem_offer", { p_offer_id: offerId });

    if (error) {
      return redirectWith({ err: error.message.slice(0, 120) });
    }

    // data is the redemption row; expose voucher_code if present
    const code = (data as any)?.voucher_code || "";
    return redirectWith({ ok: "1", ...(code ? { code } : {}) });
  } catch (e: any) {
    return redirectWith({ err: (e?.message || "unknown_error").slice(0, 120) });
  }
}
