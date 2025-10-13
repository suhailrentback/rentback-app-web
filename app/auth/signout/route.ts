// app/auth/signout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createRouteSupabase();
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore: signOut is best-effort
  }
  const url = new URL("/", req.url);
  const res = NextResponse.redirect(url);

  // Clear our role cookie too
  res.cookies.set("rb_role", "", { path: "/", maxAge: 0 });

  return res;
}
