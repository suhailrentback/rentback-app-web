// app/admin/api/staff/set-role/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set(["tenant", "landlord", "staff", "admin"]);

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => cookieStore.get(name)?.value },
  });

  const form = await req.formData();
  const userId = String(form.get("userId") || "");
  const newRole = String(form.get("newRole") || "").toLowerCase();

  // Gate: only staff/admin can call
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) {
    return NextResponse.redirect(new URL("/admin/staff?error=not_authenticated", req.url), 303);
  }
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", me.user.id)
    .maybeSingle();

  if (!myProfile || !myProfile.role || !["staff", "admin"].includes(myProfile.role.toLowerCase())) {
    return NextResponse.redirect(new URL("/admin/staff?error=not_permitted", req.url), 303);
  }

  // Validate payload
  if (!userId || !ALLOWED.has(newRole)) {
    return NextResponse.redirect(new URL("/admin/staff?error=invalid_payload", req.url), 303);
  }

  // Update role
  const { error: upErr } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
  if (upErr) {
    const msg = encodeURIComponent("update_failed");
    return NextResponse.redirect(new URL(`/admin/staff?error=${msg}`, req.url), 303);
  }

  // Best-effort audit (ignore failures)
  try {
    await supabase.from("audit_log").insert({
      actor_user_id: me.user.id,
      action: "set_role",
      entity_table: "profiles",
      entity_id: userId,
      metadata_json: { newRole },
    });
  } catch {
    // ignore
  }

  return NextResponse.redirect(new URL("/admin/staff?ok=1", req.url), 303);
}
