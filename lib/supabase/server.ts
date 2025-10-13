// lib/supabase/server.ts
import { cookies } from 'next/headers'
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs'

export function createServerSupabase() {
  // Server component usage (SSR)
  return createServerComponentClient({ cookies })
}

export function createRouteSupabase() {
  // Route handlers / server actions
  return createRouteHandlerClient({ cookies })
}
