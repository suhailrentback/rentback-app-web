// app/api/cron/overdue/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // Only allow Vercel Cron to call this (Vercel sends X-VERCEL-CRON: 1)
  const isCron = req.headers.get('x-vercel-cron') === '1';
  if (!isCron) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: 'Missing Supabase env' }, { status: 500 });
  }

  const supabase = createClient(url, anon);
  const { data, error } = await supabase.rpc('sweep_overdue');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ updated: data ?? 0 });
}
