// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Paths that need auth/role checks
const MATCHED = ["/tenant", "/landlord", "/admin"];

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Run only for our matched paths + /sign-in (see config below)
  const res = NextResponse.next();

  // Build a Supabase server client for middleware (Edge)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Correct overload: (name, value, options)
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          // Clear cookie with same scope
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  // Who is the user?
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user ?? null;

  // Resolve user role (and ensure a profile row exists)
  let role: "tenant" | "landlord" | "admin" | null = null;

  if (user) {
    // Try to read existing profile
    const { data: profile, error: readErr } = await supabase
      .from("profiles")
      .select("id, role, email")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile && !readErr) {
      // Create a default profile row with role=tenant on first visit
      const { data: inserted, error: insErr } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email ?? null,
          role: "tenant",
        })
        .select("role")
        .single();

      if (!insErr) role = (inserted?.role as any) ?? "tenant";
    } else {
      role = (profile?.role as any) ?? null;
    }
  }

  // If no session and path requires auth → send to sign-in with next
  const needsAuth = MATCHED.some((p) => path.startsWith(p));
  if (!user && needsAuth) {
    const signin = new URL("/sign-in", req.url);
    signin.searchParams.set("next", path);
    return NextResponse.redirect(signin);
  }

  // If already signed in and visiting /sign-in → send to home area by role
  if (user && path === "/sign-in") {
    const dest =
      role === "admin" ? "/admin" : role === "landlord" ? "/landlord" : "/tenant";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Role gating per section
  if (user && needsAuth) {
    const required: "tenant" | "landlord" | "admin" =
      path.startsWith("/admin")
        ? "admin"
        : path.startsWith("/landlord")
        ? "landlord"
        : "tenant";

    // If we still don't know the role, let /tenant pass (default),
    // otherwise bounce to Not Permitted
    if (!role) {
      if (required !== "tenant") {
        return NextResponse.redirect(new URL("/not-permitted", req.url));
      }
      return res;
    }

    if (role !== required) {
      return NextResponse.redirect(new URL("/not-permitted", req.url));
    }
  }

  return res;
}

// Only run middleware for these routes
export const config = {
  matcher: ["/sign-in", "/tenant/:path*", "/landlord/:path*", "/admin/:path*"],
};
