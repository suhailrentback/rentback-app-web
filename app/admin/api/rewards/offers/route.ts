// app/admin/api/rewards/offers/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function sb() {
  const cs = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(n: string) { return cs.get(n)?.value; },
        set(n: string, v: string, o: CookieOptions) { cs.set({ name: n, value: v, ...o }); },
        remove(n: string, o: CookieOptions) { cs.set({ name: n, value: "", ...o }); },
      },
    },
  );
}

async function requireStaff() {
  const supa = sb();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { data: prof } = await supa.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!prof || !["staff","admin"].includes((prof as any).role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return supa;
}

export async function GET(req: Request) {
  const supa = await requireStaff();
  // If requireStaff returned a Response, bail:
  // (Type guard)
  // @ts-ignore
  if (supa instanceof NextResponse) return supa;

  const url = new globalThis.URL(req.url);
  const q = url.searchParams.get("q") || "";

  let query = supa.from("reward_offers")
    .select("id,title,description,points_cost,is_active,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (q) query = query.ilike("title", `%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supa = await requireStaff();
  // @ts-ignore
  if (supa instanceof NextResponse) return supa;

  const ct = req.headers.get("content-type") || "";
  const isForm = ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data");
  const body = isForm ? Object.fromEntries(await (await req.formData()).entries()) : await req.json().catch(() => ({}));
  const id = (body.id || "").toString().trim();
  const title = (body.title || "").toString().trim();
  const description = (body.description || "").toString();
  const points_cost = Number(body.points_cost || 0);
  const is_active = !!(body.is_active === "on" || body.is_active === true || body.is_active === "true");

  if (!title || points_cost <= 0) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  if (id) {
    const { error } = await supa.from("reward_offers")
      .update({ title, description, points_cost, is_active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supa.from("reward_offers")
      .insert({ title, description, points_cost, is_active });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new globalThis.URL("/admin/rewards/offers", req.url), 303);
}
