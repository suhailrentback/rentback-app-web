// app/invoices/[id]/pay/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;

  // call our POST /api/payments/create
  const res = await fetch(new URL("/api/payments/create", new URL(req.url).origin), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ invoiceId: id }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return NextResponse.json(j, { status: res.status });
  }
  const { checkout_url } = await res.json();
  return NextResponse.redirect(checkout_url);
}
