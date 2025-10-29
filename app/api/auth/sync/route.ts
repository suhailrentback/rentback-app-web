import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Reads the signed-in user, fetches their profile.role, and sets rb_role cookie.
 * Staff > Landlord > Tenant precedence. Hard override for suhail@rentback.app (for testing).
 */
export async function GET() {
  const supabase = createRouteSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Not signed in
  if (userError || !user) {
    const res = NextResponse.json({ role: "unknown" }, { status: 200 });
    res.cookies.set("rb_role", "unknown", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  // Base role from profile (default tenant)
  let role: "tenant" | "landlord" | "staff" = "tenant";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "staff") role = "staff";
  else if (profile?.role === "landlord") role = "landlord";
  else role = "tenant";

  // ✅ Hard override so you have full access during testing
  if (user.email?.toLowerCase() === "suhail@rentback.app") {
    role = "staff";
  }

  const res = NextResponse.json({ role }, { status: 200 });
  res.cookies.set("rb_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
