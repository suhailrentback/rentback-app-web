// app/api/webhooks/payments/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type EventBody = {
  provider: string;                // "mock" | "stripe" | ...
  type: string;                    // "payment.succeeded" | "payment.failed" | ...
  data: {
    provider_payment_id?: string;  // gateway payment id
    amount?: number;
    currency?: string;
    invoice_id?: string;           // we embed for mock
    [k: string]: any;
  };
  [k: string]: any;
};

function ok() { return NextResponse.json({ ok: true }); }
function bad(msg: string, code = 400) { return NextResponse.json({ error: msg }, { status: code }); }

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role to bypass RLS for system updates
  );

  const body = (await req.json().catch(() => null)) as EventBody | null;
  if (!body) return bad("Invalid JSON");

  const provider = (body.provider ?? "").toLowerCase();
  const type = body.type ?? "";

  // Signature check (skip for mock)
  if (provider !== "mock") {
    const sig = (req.headers.get("x-webhook-secret") ?? "");
    const expected = process.env.PAYMENTS_WEBHOOK_SECRET ?? "";
    if (!expected || sig !== expected) return bad("Invalid signature", 401);
  }

  // Map event type -> status
  let status: "SUCCEEDED" | "FAILED" | "REQUIRES_ACTION" | "PENDING" = "PENDING";
  if (type.includes("succeeded")) status = "SUCCEEDED";
  else if (type.includes("failed") || type.includes("canceled")) status = "FAILED";
  else if (type.includes("requires_action")) status = "REQUIRES_ACTION";

  const provider_payment_id = body.data?.provider_payment_id ?? null;
  if (!provider_payment_id && provider !== "mock") {
    return bad("provider_payment_id required");
  }

  const amount = body.data?.amount ?? null;
  const currency = body.data?.currency ?? null;

  // Apply to DB (creates or updates payment, writes event, and marks invoice as paid on success)
  const { data, error } = await supabase.rpc("apply_payment_webhook", {
    p_provider: provider,
    p_provider_payment_id: provider_payment_id,
    p_status: status,
    p_amount: amount,
    p_currency: currency,
    p_payload: body as any
  });

  if (error) {
    // Bubble errors to logs
    return bad(`DB error: ${error.message}`, 500);
  }

  return ok();
}
