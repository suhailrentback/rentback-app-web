import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // must be node to read server-only envs

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const present = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(anon),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(svc),
  };

  // very light sanity checks (no secrets returned)
  const looksUrl = url.startsWith('https://') && url.includes('.supabase.co');
  const looksAnon = anon.length > 20; // anon is a long JWT
  const ok = present.NEXT_PUBLIC_SUPABASE_URL && present.NEXT_PUBLIC_SUPABASE_ANON_KEY && looksUrl && looksAnon;

  return NextResponse.json({ ok, present });
}
