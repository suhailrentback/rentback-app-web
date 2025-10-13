// lib/supabase/server.ts
import { cookies } from 'next/headers'
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs'

// Canonical helpers (no explicit return type to avoid GenericSchema type friction)
export function createServerSupabase() {
  // For server components (SSR)
  return createServerComponentClient({ cookies })
}

export function createRouteSupabase() {
  // For route handlers / server actions
  return createRouteHandlerClient({ cookies })
}

// Back-compat aliases (leave these so older imports don't break)
export const supabaseServer = createServerSupabase
export const supabaseRoute = createRouteSupabase
