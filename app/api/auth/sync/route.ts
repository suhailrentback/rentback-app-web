// app/api/auth/sync/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createRouteSupabase();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  // Try to read the role without throwing if the row doesn't exist
  const {
    data: prof,
    error: readErr,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id) // If your PK is user_id, change to .eq("user_id", user.id)
    .maybeSingle();

  let role: string | null = prof?.role ?? null;

  // If missing, upsert a default tenant record
  if (!role) {
    const { data: up, error: upErr } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id, // or user_id: user.id
          email: user.email,
          full_name: user.email ?? "",
          role: "tenant",
        },
        { onConflict: "id" } // change to "user_id" if that’s your unique key
      )
      .select("role")
      .single();

    role = up?.role ?? null;

    if (upErr) {
      // Still return something useful so the client can decide what to do
      return NextResponse.json({ role: null, error: upErr.message }, { status: 200 });
    }
  }

  return NextResponse.json({ role }, { status: 200 });
}
