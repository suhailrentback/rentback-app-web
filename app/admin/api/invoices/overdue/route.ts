// app/admin/api/invoices/overdue/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

  return { ok: true as const, sb };
}

export async function POST() {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  const sb = guard.sb;

  try {
    const { data, error } = await sb
      .from("invoices")
      .update({ status: "overdue" })
      .lt("due_date", new Date().toISOString())
      .neq("status", "paid")
      .select("id");

    if (error) {
      // Common case if CHECK constraint doesn’t include 'overdue'
      return NextResponse.json({ ok: false, skipped: true, reason: "constraint_blocked" }, { status: 200 });
    }

    return NextResponse.json({ ok: true, count: Array.isArray(data) ? data.length : 0 });
  } catch (_e) {
    return NextResponse.json({ ok: false, skipped: true, reason: "unknown" }, { status: 200 });
  }
}
