// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/sign-in",
  "/auth/callback",
  "/not-permitted",
  "/api/health",
  "/api/auth/sync",
  "/debug/status",
]);

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path.startsWith(p));

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets & public pages
  if (
    startsWithAny(pathname, [
      "/_next",
      "/favicon",
      "/robots.txt",
      "/sitemap.xml",
      "/assets",
      "/api/health",
    ]) ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  // Prepare a mutable response for cookie writes
  const res = NextResponse.next();

  // Build a Supabase server client wired to middleware cookies
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options?: CookieOptions) {
        res.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
    global: { fetch },
  });

  // Get current user (if any)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate protected sections
  const isTenantArea = pathname.startsWith("/tenant");
  const isLandlordArea = pathname.startsWith("/landlord");
  const isAdminArea = pathname.startsWith("/admin");

  if (!user) {
    // Not signed in but trying to access a protected area → go to sign-in
    if (isTenantArea || isLandlordArea || isAdminArea) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Read role safely (no .catch on the builder)
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id) // If your PK is user_id, change the column
    .maybeSingle();

  let role: string | null = prof?.role ?? null;

  // If missing, create default tenant record
  if (!role) {
    const { data: up } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id, // or user_id: user.id
          email: user.email,
          full_name: user.email ?? "",
          role: "tenant",
        },
        { onConflict: "id" }
      )
      .select("role")
      .single();

    role = up?.role ?? null;
  }

  // Simple role-based gates
  if (isTenantArea && role !== "tenant") {
    const url = req.nextUrl.clone();
    url.pathname = "/not-permitted";
    return NextResponse.redirect(url);
  }

  if (isLandlordArea && role !== "landlord") {
    const url = req.nextUrl.clone();
    url.pathname = "/not-permitted";
    return NextResponse.redirect(url);
  }

  if (isAdminArea && role !== "staff" && role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/not-permitted";
    return NextResponse.redirect(url);
  }

  return res;
}

// Run on everything except static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
