// app/api/payments/mock/checkout/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const payment_id = url.searchParams.get("payment_id");

  if (!payment_id) {
    return new NextResponse("Missing payment_id", { status: 400 });
  }

  // Use service role to lookup payment & invoice to help post back + redirect
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: payment } = await supabase
    .from("payments")
    .select("id, invoice_id, amount, currency")
    .eq("id", payment_id)
    .single();

  if (!payment) return new NextResponse("Payment not found", { status: 404 });

  const origin = new URL(req.url).origin;
  const webhookUrl = `${origin}/api/webhooks/payments`;

  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Mock Checkout</title></head>
  <body style="font-family: system-ui; padding: 32px;">
    <h1>Mock Checkout</h1>
    <p>Payment ID: <code>${payment.id}</code></p>
    <p>Invoice: <code>${payment.invoice_id}</code></p>
    <p>Amount: <strong>${payment.currency} ${(payment.amount/100).toFixed(2)}</strong></p>

    <div style="margin-top:20px; display:flex; gap:12px;">
      <button id="btn-success">Pay (Succeed)</button>
      <button id="btn-fail">Fail</button>
      <a href="/invoices/${payment.invoice_id}" style="margin-left:16px;">Back to invoice</a>
    </div>

    <script>
      const webhook = ${JSON.stringify(webhookUrl)};
      const pid = ${JSON.stringify(payment.id)};
      const invoiceId = ${JSON.stringify(payment.invoice_id)};

      async function post(type){
        const body = {
          provider: "mock",
          type,
          data: {
            provider_payment_id: pid,
            amount: ${payment.amount},
            currency: ${JSON.stringify(payment.currency)},
            invoice_id: invoiceId
          }
        };
        const res = await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          window.location.href = "/invoices/" + invoiceId;
        } else {
          const t = await res.text();
          alert("Webhook error: " + t);
        }
      }

      document.getElementById("btn-success").onclick = () => post("payment.succeeded");
      document.getElementById("btn-fail").onclick = () => post("payment.failed");
    </script>
  </body>
</html>`;

  return new NextResponse(html, { headers: { "content-type": "text/html" } });
}
