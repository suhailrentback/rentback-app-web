// app/auth/signout-everywhere/route.ts
import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

// Prefer NEXT_PUBLIC_SITE_URL if present, fall back to SITE_URL, then sane defaults per app.
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  // NOTE: set this per repo before deploying:
  // - For app repo:    https://www.rentback.app
  // - For admin repo:  https://admin.rentback.app
  "https://www.rentback.app";

async function signOutEverywhere() {
  const sb = createRouteSupabase();
  try {
    // This invalidates ALL refresh tokens for the current user (kills sessions on every device).
    await sb.auth.signOut({ scope: "global" });
  } catch {
    // No-op on error to avoid leaking details; redirect either way.
  }
}

export async function GET() {
  await signOutEverywhere();
  return NextResponse.redirect(new URL("/", SITE));
}

export const POST = GET;
