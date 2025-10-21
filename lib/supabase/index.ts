// lib/supabase/index.ts
// Client-only barrel to avoid pulling next/headers into the client graph.
export { getSupabaseBrowser } from "./client";

// Intentionally DO NOT re-export server helpers here.
// Server code must import from "@/lib/supabase/server" directly.
