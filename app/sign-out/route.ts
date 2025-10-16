// WEB: /app/sign-out/route.ts (Next.js App Router)
// Server route that signs the user out and redirects to /sign-in.
// Uses @supabase/ssr so we don't depend on @supabase/auth-helpers-nextjs.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

function getServerSupabase() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // In route handlers, cookies() is writable.
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", expires: new Date(0), ...options });
        },
      },
    }
  );
  return supabase;
}

async function signOutAndRedirect(req: Request) {
  const supabase = getServerSupabase();
  // Ignore error here; even if the session is already gone, we still redirect.
  await supabase.auth.signOut();

  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/sign-in?from=signout", url.origin), { status: 302 });
}

export async function GET(req: Request) {
  return signOutAndRedirect(req);
}

export async function POST(req: Request) {
  return signOutAndRedirect(req);
}
