import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, opts: any) {
          cookies().set(name, value, opts);
        },
        remove(name: string, opts: any) {
          cookies().set(name, "", { ...opts, maxAge: 0 });
        },
      },
    }
  );

  const { event, session } = body;

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    const { error } = await supabase.auth.setSession(session);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  } else if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true });
}
