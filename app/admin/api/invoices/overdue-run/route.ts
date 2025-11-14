// app/admin/api/invoices/overdue-run/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sbFromCookies() {
  const jar = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });
}

async function requireStaffOrAdmin() {
  const sb = sbFromCookies();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401 as const, sb };
  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["staff", "admin"].includes(String(me.role))) {
    return { ok: false as const, status: 403 as const, sb };
  }
  return { ok: true as const, sb };
}

export async function POST() {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  const { sb } = guard;

  const today = new Date().toISOString().slice(0, 10);
  // Update eligible invoices
  const { data: toOverdue, error: findErr } = await sb
    .from("invoices")
    .select("id")
    .lt("due_date", today)
    .in("status", ["open", "issued"]);

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!toOverdue?.length) return NextResponse.json({ updated: 0, ids: [] });

  const ids = toOverdue.map((r) => r.id);
  const { error: upErr } = await sb.from("invoices").update({ status: "overdue" }).in("id", ids);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ updated: ids.length, ids });
}
