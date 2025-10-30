// app/api/debug/whoami/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createRouteSupabase();

  const { data: uData, error: uErr } = await supabase.auth.getUser();
  if (uErr || !uData?.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const userId = uData.user.id;
  const email = uData.user.email ?? null;

  const { data: me, error: pErr } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", userId)
    .maybeSingle();

  return NextResponse.json({
    authenticated: true,
    userId,
    email,
    profile: me ?? null,
    profileError: pErr?.message ?? null,
  });
}
