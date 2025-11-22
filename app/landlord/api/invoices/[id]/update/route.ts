// app/landlord/api/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sb() {
  const jar = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get: (n: string) => jar.get(n)?.value,
      set() {},
      remove() {},
    },
  });
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const bodyType = req.headers.get("content-type") || "";
  let amount = "", description = "", status = "", due = "";
  if (bodyType.includes("application/x-www-form-urlencoded") || bodyType.includes("multipart/form-data")) {
    const form = await req.formData();
    amount = String(form.get("amount") || "");
    description = String(form.get("description") || "");
    status = String(form.get("status") || "");
    due = String(form.get("due_date") || "");
  } else if (bodyType.includes("application/json")) {
    const js = await req.json().catch(() => ({}));
    amount = String(js.amount || "");
    description = String(js.description || "");
    status = String(js.status || "");
    due = String(js.due_date || "");
  }

  const amt = Number(String(amount).replace(/[, ]+/g, ""));
  const amount_cents = Number.isFinite(amt) ? Math.round(amt * 100) : null;
  const allowed = new Set(["OPEN", "PAID"]); // keep simple for now
  const upd: any = {
    description: description || null,
    due_date: due || null,
  };
  if (amount_cents !== null) upd.amount_cents = amount_cents;
  if (allowed.has((status || "").toUpperCase())) upd.status = (status || "").toUpperCase();

  const client = sb();

  // RLS enforces landlord ownership; we still return friendly errors
  const { data, error } = await client.from("invoices").update(upd).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 400 });

  const back = new URL(`/landlord/invoices/${id}/edit?saved=1`, req.url);
  return NextResponse.redirect(back, 303);
}
