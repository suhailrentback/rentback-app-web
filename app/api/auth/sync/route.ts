// app/api/auth/sync/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabase } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createRouteSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      // not signed in
      return NextResponse.json({ role: null }, { status: 401 });
    }

    // Ensure a profile row exists (admin bypasses RLS)
    const admin = getSupabaseAdmin();
    // Default role = tenant if row doesn’t exist
    const upsertPayload = {
      id: user.id,
      email: user.email ?? "",
      role: "tenant",
    };

    // Upsert on id
    await admin
      .from("profiles")
      .upsert(upsertPayload, { onConflict: "id" });

    // Read back the role (still via admin to avoid RLS surprises)
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "tenant";

    // Set a non-HTTP-only role cookie for middleware/page guards
    const res = NextResponse.json({ role });
    res.cookies.set("rb_role", role, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (e) {
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}
