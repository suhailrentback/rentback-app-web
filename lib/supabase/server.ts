// lib/supabase/server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// This is the only function we need for this page.
// We are simplifying the file to remove any other potential issues.
export function createServerSupabase() {
  return createServerComponentClient({ cookies });
}
