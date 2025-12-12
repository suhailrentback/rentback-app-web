// app/landlord/api/payouts/request/route.ts
import { NextResponse } from "next/server";

function parseAmountToCents(input: string | null): number | null {
  if (!input) return null;
  const n = Number(input);
  if (!isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function POST(req: Request) {
  try {
    // Accept both form POST and JSON
    let amountCents: number | null = null;
    let notes = "";

    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await req.formData();
      amountCents = parseAmountToCents(String(form.get("amount") ?? ""));
      notes = String(form.get("notes") ?? "");
    } else if (ct.includes("application/json")) {
      const body = (await req.json()) as { amount?: string | number; notes?: string };
      const raw = typeof body.amount === "number" ? String(body.amount) : body.amount ?? "";
      amountCents = parseAmountToCents(raw);
      notes = body.notes ?? "";
    }

    if (!amountCents) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }

    // ⛳ Placeholder: We’ll wire Supabase + RLS validations in 4.8.
    // For now, just bounce back to the page with a basic success notice.
    const url = new globalThis.URL("/landlord/payouts", process.env.SITE_URL);
    url.searchParams.set("requested", "true");
    return NextResponse.redirect(url, 303);
  } catch (err: any) {
    return NextResponse.json({ error: "request_failed", detail: err?.message ?? String(err) }, { status: 500 });
  }
}
