// app/auth/signout/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createRouteSupabase();
  // Best-effort sign-out; ignore errors to always move user along
  await supabase.auth.signOut().catch(() => {});

  const res = NextResponse.redirect(new URL("/sign-in", req.url));
  // Clear cached role cookie
  res.cookies.set("rb_role", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return res;
}
