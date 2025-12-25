// app/api/health/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    env: process.env.VERCEL_ENV ?? "development",
    timestamp: new Date().toISOString(),
  });
}
