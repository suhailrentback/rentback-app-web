// lib/env.ts
import "server-only";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`[env] Missing required env vars: ${missing.join(", ")}`);
}

export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  VERCEL_ENV: process.env.VERCEL_ENV ?? "development",
};
