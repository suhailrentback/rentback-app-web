// app/api/auth/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return sync(req);
}
export async function POST(req: NextRequest) {
  return sync(req);
}

async function sync(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  const email = user.email ?? "";
  const isStaff = email.toLowerCase().endsWith("@rentback.app");
  const defaultRole = (isStaff ? "staff" : "tenant") as "tenant" | "staff";

  // 1) Read existing profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", user.id)
    .single();

  let role = existing?.role ?? null;

  // 2) Upsert if missing
  if (!existing) {
    const { data: inserted } = await supabase
      .from("profiles")
      .insert({ id: user.id, email, role: defaultRole })
      .select("role")
      .single();
    role = inserted?.role ?? defaultRole;
  } else if (!role) {
    const { data: updated } = await supabase
      .from("profiles")
      .update({ role: defaultRole })
      .eq("id", user.id)
      .select("role")
      .single();
    role = updated?.role ?? defaultRole;
  }

  // 3) Set a small, non-HttpOnly role cookie (middleware can read it)
  const res = NextResponse.json({ role });
  res.cookies.set("rb_role", role!, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Optional: honor ?next=... if present
  const next = req.nextUrl.searchParams.get("next");
  if (next) {
    res.headers.set("x-rb-next", next);
  }

  return res;
}
