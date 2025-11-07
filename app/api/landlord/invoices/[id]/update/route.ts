// app/api/landlord/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const AllowedStatus = ["open", "issued", "paid", "overdue", "draft"] as const;

const BodySchema = z.object({
  amount: z
    .preprocess((v) => {
      const n = Number.parseFloat(String(v ?? ""));
      return Number.isFinite(n) ? n : NaN;
    }, z.number().nonnegative()),
  currency: z
    .string()
    .optional()
    .transform((s) => (s ?? "PKR").trim().toUpperCase())
    .pipe(z.string().length(3)),
  description: z.string().max(2000).optional(),
  status: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .refine((s) => (AllowedStatus as readonly string[]).includes(s), {
      message: "invalid_status",
    }),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteSupabase();
  const { id } = params;

  let parsed: z.infer<typeof BodySchema>;
  try {
    const form = await req.formData();
    parsed = BodySchema.parse({
      amount: form.get("amount"),
      currency: form.get("currency"),
      description: form.get("description") ?? "",
      status: form.get("status"),
    });
  } catch (e) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const amount_cents = Math.round(parsed.amount * 100);
  const total_amount = parsed.amount;

  const { error } = await supabase
    .from("invoices")
    .update({
      total_amount,
      amount_cents,
      currency: parsed.currency,
      description: parsed.description ?? null,
      status: parsed.status,
      // (optionally you could also set updated_at = now() via trigger)
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 400 });
  }

  // Redirect back to landlord home with a success hint
  const url = new URL(req.url);
  url.pathname = "/landlord";
  url.searchParams.set("updated", "1");
  return NextResponse.redirect(url, { status: 303 });
}
