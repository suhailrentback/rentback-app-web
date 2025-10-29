import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createRouteSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const rbRole = cookies().get("rb_role")?.value ?? null;

  if (error || !user) {
    return NextResponse.json(
      { authed: false, error: error?.message ?? "No user", rb_role: rbRole },
      { status: 200 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json(
    {
      authed: true,
      id: user.id,
      email: user.email,
      profile_role: profile?.role ?? null,
      rb_role: rbRole,
    },
    { status: 200 }
  );
}
