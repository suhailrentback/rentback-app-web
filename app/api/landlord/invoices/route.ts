// app/api/landlord/invoices/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateInvoice = z.object({
  tenant_id: z.string().uuid(),
  number: z.string().min(1).max(120).optional().or(z.literal("")).transform(v => v || undefined),
  amount_rupees: z.coerce.number().int().nonnegative(),
  currency: z.string().default("PKR").transform(s => s.trim().toUpperCase()).refine(s => /^[A-Z]{3}$/.test(s), "currency must be 3 letters"),
  issued_at: z.string().optional().or(z.literal("")).transform(v => v || undefined),
  due_date: z.string(), // HTML date (YYYY-MM-DD), required
  description: z.string().optional().or(z.literal("")).transform(v => v || undefined),
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  // Must be signed-in
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in?next=/landlord/invoices/new", req.url));
  }

  // Check role from profiles (we allow landlord or staff)
  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (meErr || !me || !["landlord", "staff"].includes(String(me.role))) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  // Read form data
  const form = await req.formData();
  const payload = Object.fromEntries(form.entries());

  const parsed = CreateInvoice.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tenant_id, number, amount_rupees, currency, issued_at, due_date, description } = parsed.data;

  // Convert to db shapes
  const amount_cents = amount_rupees * 100;
  const issuedISO = issued_at ? new Date(issued_at).toISOString() : new Date().toISOString();
  const dueISO = new Date(due_date).toISOString();

  // Insert — status defaults to 'open' via CHECK/DEFAULT or we set explicitly
  const { data: inserted, error } = await supabase
    .from("invoices")
    .insert({
      tenant_id,
      status: "open",
      issued_at: issuedISO,
      due_date: dueISO,
      amount_cents,
      total_amount: amount_rupees, // mirrors rupees for display
      currency,
      description,
      number,
    })
    .select("id, number")
    .maybeSingle();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message || "Insert failed" }, { status: 500 });
  }

  // Soft-success UX — back to landlord with a flag (we can deep-link later)
  const to = new URL(`/landlord?created=${encodeURIComponent(inserted.number ?? inserted.id)}`, req.url);
  return NextResponse.redirect(to, { status: 303 });
}
