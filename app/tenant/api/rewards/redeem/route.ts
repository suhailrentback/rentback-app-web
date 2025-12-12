// app/tenant/api/rewards/redeem/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { sendEmail } from "@/lib/email";

function sb() {
  const cs = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(n) { return cs.get(n)?.value; },
        set(n, v, o: CookieOptions) { cs.set({ name: n, value: v, ...o }); },
        remove(n, o: CookieOptions) { cs.set({ name: n, value: "", ...o }); },
      },
    }
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

  // Try the new RPC first; fall back to older one if missing
  let voucher: string | null = null;
  let redeemErr: string | null = null;

  const tryNew = await supa.rpc("redeem_offer_with_voucher", { p_offer_id: offerId });
  if (tryNew.error) {
    // Fallback old RPC
    const old = await supa.rpc("redeem_offer", { p_offer_id: offerId });
    if (old.error) {
      redeemErr = old.error.message || tryNew.error.message || "redeem_failed";
    }
  } else {
    const row = Array.isArray(tryNew.data) ? tryNew.data[0] : tryNew.data;
    voucher = row?.voucher_code ?? null;
  }

  if (redeemErr) {
    const safe = encodeURIComponent(redeemErr);
    return NextResponse.redirect(new globalThis.URL(`/tenant/rewards?err=${safe}`, req.url), 303);
  }

  // Load offer title for email
  const { data: offer } = await supa.from("reward_offers").select("title,points_cost").eq("id", offerId).maybeSingle();
  const to = user.email || "";
  if (to) {
    const subject = voucher
      ? "Your RentBack voucher code"
      : "Your RentBack redemption";
    const codeHtml = voucher ? `<p style="font-size:18px"><b>Voucher code:</b> ${voucher}</p>` : "";
    const html = `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif">
        <h2>Thanks for redeeming${offer?.title ? `: ${offer.title}` : ""}</h2>
        <p>You redeemed ${offer?.points_cost ?? ""} points.</p>
        ${codeHtml}
        <p>If you didn't make this redemption, contact support.</p>
      </div>
    `;
    await sendEmail({ to, subject, html, text: `Redemption complete. ${voucher ? "Voucher: " + voucher : ""}` });
  }

  return NextResponse.redirect(new globalThis.URL("/tenant/rewards?ok=1", req.url), 303);
}
