// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function sbFromCookies() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

// GET /api/notifications?limit=50&all=0
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 50);
  const all = searchParams.get("all") === "1";

  const sb = sbFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let q = sb.from("notifications")
    .select("*")
    .order("queued_at", { ascending: false })
    .limit(Math.min(limit, 200));

  if (!all) {
    q = q.eq("channel", "INAPP").neq("status", "READ");
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notifications: data });
}

// PATCH /api/notifications  body: { ids: string[] }
export async function PATCH(req: NextRequest) {
  const sb = sbFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

  const { data, error } = await sb.rpc("notify_mark_read", { p_ids: ids });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ updated: data ?? 0 });
}
