// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const BAD_BOTS = [/^curl/i, /python-requests/i, /^wget/i];

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (BAD_BOTS.some((re) => re.test(ua))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (req.nextUrl.pathname.startsWith("/api")) {
    const allowed = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    if (!allowed.includes(req.method)) {
      return new NextResponse("Method Not Allowed", { status: 405 });
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-DNS-Prefetch-Control", "on");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
