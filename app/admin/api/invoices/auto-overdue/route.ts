// app/admin/api/invoices/auto-overdue/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  const jar = cookies();
  return createServerClient(URL, ANON, {
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
  return { ok: true as const, sb };
}

// Dry-run: count how many would flip
export async function GET() {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { sb } = guard;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await sb
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
    .lt("due_date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase returns count on head:true even though data is null
  // Satisfy TS with nullish coalescing
  const count = (data as any)?.length ?? (error as any)?.count ?? sb; // fallback noop; count returned separately
  // Better: re-run without head to get length safely:
  const { data: list } = await sb
    .from("invoices")
    .select("id")
    .eq("status", "open")
    .lt("due_date", today);
  const n = Array.isArray(list) ? list.length : 0;

  return NextResponse.json({ ok: true, would_update: n });
}

// Real run: perform update
export async function POST() {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { sb } = guard;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await sb
    .from("invoices")
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .eq("status", "open")
    .lt("due_date", today)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "update_failed", details: error.message }, { status: 500 });
  }

  const updated = Array.isArray(data) ? data.length : 0;
  return NextResponse.json({ ok: true, updated });
}
