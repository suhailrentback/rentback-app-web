// app/admin/api/invoices/auto-overdue/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  const jar = cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      get: (name: string) => jar.get(name)?.value,
    },
  });
}

async function requireStaffOrAdmin() {
  const sb = getClient();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401 as const, error: "unauthorized" };

  const { data: me, error } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", uid)
    .maybeSingle();

  if (error || !me) return { ok: false as const, status: 403 as const, error: "profile_not_found" };
  if (!["staff", "admin"].includes(String(me.role))) {
    return { ok: false as const, status: 403 as const, error: "forbidden" };
  }
  return { ok: true as const, sb, uid };
}

export async function POST() {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { sb } = guard;

  // Past due = due_date < today (date-only compare); only from OPEN
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await sb
    .from("invoices")
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .eq("status", "open")
    .lt("due_date", today)
    .select("id"); // return updated ids for count

  if (error) {
    return NextResponse.json({ error: "update_failed", details: error.message }, { status: 500 });
  }

  const updated = Array.isArray(data) ? data.length : 0;
  return NextResponse.json({ ok: true, updated });
}
