// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DASHES = [
  ["/tenant", "tenant"],
  ["/landlord", "landlord"],
  ["/admin", "staff"],
] as const;

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const { pathname } = url;
  const role = req.cookies.get("rb_role")?.value;

  // Protect dashboards by cookie role
  for (const [prefix, needed] of DASHES) {
    if (pathname.startsWith(prefix)) {
      if (!role) {
        url.pathname = "/sign-in";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      if (role !== needed) {
        url.pathname = "/not-permitted";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  // If you land on not-permitted but actually have a role, push to your dashboard
  if (pathname === "/not-permitted") {
    if (role === "tenant") {
      url.pathname = "/tenant";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (role === "landlord") {
      url.pathname = "/landlord";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (role === "staff") {
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tenant/:path*", "/landlord/:path*", "/admin/:path*", "/not-permitted"],
};
