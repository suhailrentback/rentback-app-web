// app/admin/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  const jar = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });
}

async function requireStaffOrAdmin() {
  const sb = getClient();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401 as const, error: "unauthorized" };

  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["staff", "admin"].includes(String(me.role))) {
    return { ok: false as const, status: 403 as const, error: "forbidden" };
  }
  return { ok: true as const, sb, uid };
}

async function getFormOrJsonId(req: Request): Promise<string | null> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const id = form.get("paymentId") ?? form.get("id");
    return typeof id === "string" && id ? id : null;
  }
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const id = body?.paymentId ?? body?.id;
    return typeof id === "string" && id ? id : null;
  }
  // query param fallback
  const url = new (globalThis as any).URL(req.url);
  const qp = url.searchParams.get("paymentId") || url.searchParams.get("id");
  return typeof qp === "string" && qp ? qp : null;
}

export async function POST(req: Request) {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { sb } = guard;

  const id = await getFormOrJsonId(req);
  if (!id) return NextResponse.json({ error: "missing_payment_id" }, { status: 400 });

  // fetch payment + joined invoice
  const { data: pay, error: perr } = await sb
    .from("payments")
    .select("id, status, invoice:invoices(id, number, due_date)")
    .eq("id", id)
    .maybeSingle();

  if (perr) return NextResponse.json({ error: "lookup_failed", details: perr.message }, { status: 500 });
  if (!pay) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });

  // update payment -> confirmed
  const now = new Date().toISOString();
  const { error: uerr } = await sb
    .from("payments")
    .update({ status: "confirmed", confirmed_at: now, updated_at: now })
    .eq("id", id);

  if (uerr) return NextResponse.json({ error: "update_failed", details: uerr.message }, { status: 500 });

  // redirect back to admin payments list preserving nothing (simple)
  const back = "/admin/payments";
  return NextResponse.redirect(back, 303);
}
