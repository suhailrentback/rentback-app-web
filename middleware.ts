// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Very simple best-effort rate limit for /api/* routes.
 * Works per-edge instance and may reset on cold starts (acceptable for basic hardening).
 * Configure via env:
 *   RATE_LIMIT_MAX=120 requests per window
 *   RATE_LIMIT_WINDOW_MS=60000 (1 minute)
 * Disable with RATE_LIMIT_DISABLED=1
 */
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");
const MAX = Number(process.env.RATE_LIMIT_MAX ?? "120");
const buckets = new Map<string, { count: number; window: number }>();

export function middleware(req: NextRequest) {
  // Only guard API routes
  if (!req.nextUrl.pathname.startsWith("/api")) return NextResponse.next();
  if (process.env.RATE_LIMIT_DISABLED === "1") return NextResponse.next();

  const ip =
    req.ip ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.window) {
    buckets.set(key, { count: 1, window: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (entry.count >= MAX) {
    const retry = Math.max(1, Math.ceil((entry.window - now) / 1000));
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(retry) },
    });
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
