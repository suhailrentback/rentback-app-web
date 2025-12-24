// app/api/payments/create/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function originOf(req: Request) {
  const u = new URL(req.url);
  return u.origin;
}

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json().catch(() => ({}));
    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify invoice ownership + get totals
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("id, user_id, status, total, currency")
      .eq("id", invoiceId)
      .single();

    if (invErr || !inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (inv.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!["ISSUED", "OVERDUE"].includes(inv.status)) {
      return NextResponse.json({ error: "Invoice not payable in current status" }, { status: 400 });
    }

    const amount = typeof inv.total === "number" ? inv.total : 0;
    const currency = (inv.currency ?? "USD").toUpperCase();
    const provider = (process.env.PAYMENTS_PROVIDER ?? "mock").toLowerCase();

    // Create a pending payment row
    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        provider,
        amount,
        currency,
        status: "PENDING",
        raw: { invoice_id: invoiceId },
      })
      .select("id")
      .single();

    if (pErr || !payment) {
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    // For mock provider, we serve a built-in “checkout”
    const base = originOf(req);
    const checkout_url =
      provider === "mock"
        ? `${base}/api/payments/mock/checkout?payment_id=${payment.id}`
        : `${base}/api/payments/mock/checkout?payment_id=${payment.id}`; // placeholder for real PSP

    return NextResponse.json({ checkout_url, payment_id: payment.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
