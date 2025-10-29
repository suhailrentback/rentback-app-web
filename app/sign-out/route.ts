// app/sign-out/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Support both GET (links) and POST (forms/fetch)
export async function GET(req: Request) {
  return handleSignOut(req);
}
export async function POST(req: Request) {
  return handleSignOut(req);
}

async function handleSignOut(req: Request) {
  const supabase = createRouteSupabase();

  // Best-effort signout from Supabase
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore — we still want to clear our cookie and redirect
  }

  // Clear our role cookie so middleware/guards stop blocking
  try {
    cookies().delete("rb_role");
  } catch {
    // ignore
  }

  // Send user back to Sign In
  const url = new URL("/sign-in", req.url);
  return NextResponse.redirect(url, { status: 302 });
}
