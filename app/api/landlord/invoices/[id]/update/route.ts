// app/api/landlord/invoices/[id]/update/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const AllowedStatus = z.enum(["issued", "paid", "overdue"]);

const FormSchema = z.object({
  number: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
  total_amount: z
    .string()
    .or(z.number())
    .transform((v) => (typeof v === "string" ? parseFloat(v) : v))
    .refine((n) => Number.isFinite(n) && n >= 0, "Invalid amount")
    .optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  status: z
    .string()
    .transform((s) => s.toLowerCase())
    .pipe(AllowedStatus)
    .optional(),
  issued_at: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined))
    .refine((d) => d === undefined || !isNaN(d.getTime()), {
      message: "Invalid issued_at",
    }),
  due_date: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined))
    .refine((d) => d === undefined || !isNaN(d.getTime()), {
      message: "Invalid due_date",
    }),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteSupabase();
    const form = await req.formData();

    const values = Object.fromEntries(form.entries());
    const parsed = FormSchema.safeParse(values);
    if (!parsed.success) {
      return NextResponse.redirect(
        new URL(`/landlord/invoices?err=update_failed`, req.url),
        { status: 303 }
      );
    }

    const patch: Record<string, unknown> = {};
    if (parsed.data.number !== undefined) patch.number = parsed.data.number;
    if (parsed.data.description !== undefined)
      patch.description = parsed.data.description;
    if (parsed.data.currency !== undefined)
      patch.currency = parsed.data.currency;
    if (parsed.data.status !== undefined) patch.status = parsed.data.status;
    if (parsed.data.issued_at !== undefined)
      patch.issued_at = parsed.data.issued_at!.toISOString();
    if (parsed.data.due_date !== undefined)
      patch.due_date = parsed.data.due_date!.toISOString();

    if (parsed.data.total_amount !== undefined) {
      const amount = parsed.data.total_amount!;
      patch.total_amount = amount;
      // keep cents column consistent if your schema uses it
      patch.amount_cents = Math.round(amount * 100);
    }

    if (Object.keys(patch).length === 0) {
      // nothing to update
      return NextResponse.redirect(
        new URL(`/landlord/invoices?ok=updated`, req.url),
        { status: 303 }
      );
    }

    const { error } = await supabase
      .from("invoices")
      .update(patch)
      .eq("id", params.id);

    if (error) {
      // Likely RLS failure or constraint issue
      return NextResponse.redirect(
        new URL(`/landlord/invoices?err=update_failed`, req.url),
        { status: 303 }
      );
    }

    return NextResponse.redirect(
      new URL(`/landlord/invoices?ok=updated`, req.url),
      { status: 303 }
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/landlord/invoices?err=update_failed`, req.url),
      { status: 303 }
    );
  }
}
