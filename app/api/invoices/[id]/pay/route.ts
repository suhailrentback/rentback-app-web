// app/api/invoices/[id]/pay/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type IdParam = { params: { id: string } };

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(_req: Request, { params }: IdParam) {
  const id = params.id;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = cookies();

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("id, landlord_id, status")
    .eq("id", id)
    .single();

  if (invErr || !inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (inv.landlord_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (inv.status === "PAID") {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }
  if (!["ISSUED", "OVERDUE"].includes(inv.status)) {
    return NextResponse.json({ error: "Only ISSUED/OVERDUE can be paid" }, { status: 409 });
  }

  const { error: updErr } = await supabase
    .from("invoices")
    .update({ status: "PAID" })
    .eq("id", id);

  if (updErr) {
    return NextResponse.json({ error: "Failed to mark paid", details: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
