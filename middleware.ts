// middleware.ts (only the core bits shown)
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware"; // whatever you named it

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/sign-in",
  "/auth/callback",
  "/api/auth/sync",
  "/api/health",
  "/debug/status",
  "/not-permitted",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes go through
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const supabase = createMiddlewareSupabase(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → send to sign-in with next
  if (!user) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Try role from cookie first
  const role = req.cookies.get("rb_role")?.value;

  // If missing, bounce through /api/auth/sync once to seed cookie/profile
  if (!role) {
    const syncUrl = new URL("/api/auth/sync", req.url);
    syncUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(syncUrl);
  }

  // Route-level authorization (simple example)
  if (pathname.startsWith("/tenant") && role !== "tenant" && role !== "staff") {
    return NextResponse.redirect(new URL("/not-permitted", req.url));
  }
  if (pathname.startsWith("/landlord") && role !== "landlord" && role !== "staff") {
    return NextResponse.redirect(new URL("/not-permitted", req.url));
  }
  if (pathname.startsWith("/admin") && role !== "staff") {
    return NextResponse.redirect(new URL("/not-permitted", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // protect app pages; leave assets and API not listed above alone
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
