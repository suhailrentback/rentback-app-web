// app/api/auth/sync/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/auth/sync
 * Body: { access_token: string, refresh_token: string }
 * Sets the secure Supabase auth cookies so server components/guards see the session.
 */
export async function POST(req: Request) {
  const { access_token, refresh_token } =
    (await req.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
    };

  if (!access_token || !refresh_token) {
    return NextResponse.json(
      { ok: false, error: "missing tokens" },
      { status: 400 }
    );
  }

  const cookieStore = cookies();

  // Prepare a response we can mutate cookies on
  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return res;
}
