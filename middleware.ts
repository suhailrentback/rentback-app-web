// middleware.ts
import { NextRequest, NextResponse } from "next/server";
// If you have a helper, keep this import. If not, remove it and the usage below.
// import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

/** Public routes that never require auth */
const PUBLIC_PATHS = new Set<string>([
  "/",
  "/sign-in",
  "/sign-up",
  "/auth/verify",
  "/auth/callback",
  "/not-permitted",
  "/api/auth/email-signup", // public API for creating accounts
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals & static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // --- If you have a Supabase helper, uncomment this section ---
  // const { supabase, response } = createMiddlewareSupabase(req);
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   const url = req.nextUrl.clone();
  //   url.pathname = "/sign-in";
  //   url.searchParams.set("next", pathname);
  //   return NextResponse.redirect(url);
  // }
  // // Role enforcement via cookie set by /api/auth/sync
  // const role = req.cookies.get("rb_role")?.value;
  // if (pathname.startsWith("/tenant") && role !== "tenant") {
  //   return NextResponse.redirect(new URL("/not-permitted", req.url));
  // }
  // if (pathname.startsWith("/landlord") && role !== "landlord") {
  //   return NextResponse.redirect(new URL("/not-permitted", req.url));
  // }
  // if (pathname.startsWith("/admin") && role !== "staff") {
  //   return NextResponse.redirect(new URL("/not-permitted", req.url));
  // }
  // return response;

  // --- Minimal fallback (no helper): let protected pages self-guard server-side ---
  return NextResponse.next();
}

/** Keep config **separate** and simple */
export const config = {
  matcher: ["/((?!.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif)$).*)"],
};
