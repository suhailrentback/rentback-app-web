// app/admin/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE = process.env.SITE_URL || "https://www.rentback.app";

function supabaseFromCookies() {
  const jar = cookies();
  return createServerClient(URL, ANON, {
    cookies: { get: (n: string) => jar.get(n)?.value },
  });
}

async function requireStaff() {
  const sb = supabaseFromCookies();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401 };

  const { data: prof } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", uid)
    .maybeSingle();

  const role = String(prof?.role ?? "");
  if (role !== "staff" && role !== "admin") return { ok: false as const, status: 403 };

  return { ok: true as const, sb, uid };
}

function getFormOrJsonId: (req: Request) => Promise<string | null> {
  return async (req: Request) => {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const id = fd.get("paymentId");
      return typeof id === "string" ? id : null;
    }
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => null);
      const id = body?.paymentId ?? body?.id;
      return typeof id === "string" ? id : null;
    }
    return null;
  };
}

export async function POST(req: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  const sb = guard.sb;

  const paymentId = await getFormOrJsonId(req);
  if (!paymentId) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  // 1) Confirm payment
  const { data: updated, error: upErr } = await sb
    .from("payments")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", paymentId)
    .select("id, amount_cents, currency, tenant_id, invoice_id")
    .maybeSingle();

  if (upErr || !updated) {
    return NextResponse.json({ error: "update_failed" }, { status: 400 });
  }

  // 2) Load invoice (number) and tenant email
  const invoiceId = updated.invoice_id;
  const [{ data: inv }, { data: tenant }] = await Promise.all([
    sb.from("invoices").select("id, number").eq("id", invoiceId).maybeSingle(),
    sb.from("profiles").select("email, full_name").eq("user_id", updated.tenant_id).maybeSingle(),
  ]);

  // 3) Email (no-op if EMAIL_PROVIDER=none)
  if (tenant?.email && inv?.id) {
    const receiptUrl = `${SITE}/api/tenant/invoices/${inv.id}/receipt`;
    const amount =
      typeof updated.amount_cents === "number" ? (updated.amount_cents / 100).toFixed(2) : String(updated.amount_cents);
    const subject = `Payment confirmed — Invoice ${inv.number ?? inv.id}`;
    const text =
      `Hi${tenant.full_name ? " " + tenant.full_name : ""},\n\n` +
      `Your payment of ${amount} ${String(updated.currency).toUpperCase()} was confirmed.\n` +
      `Receipt: ${receiptUrl}\n\n` +
      `Thanks,\nRentBack`;

    await sendEmail({ to: tenant.email, subject, text });
  }

  // 4) Redirect back to Admin payments
  const url = new URL(`${SITE}/admin/payments`);
  url.searchParams.set("ok", "1");
  return NextResponse.redirect(url, { status: 303 });
}
