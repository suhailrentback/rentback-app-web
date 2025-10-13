// lib/supabase/server.ts
import { cookies } from 'next/headers'
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs'

// Canonical helpers (no explicit return types — let TS infer)
export function createServerSupabase() {
  return createServerComponentClient({ cookies })
}

export function createRouteSupabase() {
  return createRouteHandlerClient({ cookies })
}

// Back-compat exports for any existing imports
export const supabaseServer = createServerSupabase
export const supabaseRoute = createRouteSupabase
