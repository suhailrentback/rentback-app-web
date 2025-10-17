// app/api/auth/sync/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Ensures there's a profile row + role, and sets rb_role cookie.
 * Returns { role }.
 */
export async function GET() {
  const res = NextResponse.json({ ok: true });

  try {
    const supabase = getSupabaseServer();

    // 1) Who is signed in?
    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData?.user) {
      // Clear role cookie if present
      res.cookies.set("rb_role", "", { path: "/", maxAge: 0, sameSite: "lax" });
      return NextResponse.json(
        { role: null, error: authErr?.message ?? "No user" },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // 2) Try to read the role from profiles
    let role: string | null = null;
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profErr && prof?.role) {
      role = prof.role as string;
    } else {
      // 3) If no row/role, upsert default tenant
      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert({ id: userId, role: "tenant" }, { onConflict: "id" });

      if (upsertErr) {
        return NextResponse.json(
          { role: null, error: upsertErr.message },
          { status: 500 }
        );
      }
      role = "tenant";
    }

    // 4) Set cookie for fast guards
    res.cookies.set("rb_role", role, {
      path: "/",
      httpOnly: false, // readable by Server Components via next/headers
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ role });
  } catch (e: any) {
    return NextResponse.json({ role: null, error: String(e?.message || e) }, { status: 500 });
  }
}
