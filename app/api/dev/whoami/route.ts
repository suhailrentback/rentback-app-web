// app/api/dev/whoami/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error) return NextResponse.json({ error: error.message }, { status: 401 });

    const role = cookies().get("rb_role")?.value ?? null;
    const user = data?.user
      ? { id: data.user.id, email: data.user.email }
      : null;

    return NextResponse.json({ user, role });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
