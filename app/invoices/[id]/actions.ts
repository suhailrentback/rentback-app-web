"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
// ✅ revalidatePath must come from next/cache
import { revalidatePath } from "next/cache";
// redirect still comes from next/navigation
import { redirect } from "next/navigation";

export async function confirmPaid(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") || "");
  const amountMajor = String(formData.get("amount") || "").trim();
  const method = String(formData.get("method") || "").trim() || null;
  const reference = String(formData.get("reference") || "").trim() || null;

  if (!invoiceId) {
    redirect("/invoices?error=Missing+invoice+id");
  }

  let amountCents: number | null = null;
  if (amountMajor !== "") {
    const n = Number(amountMajor);
    if (Number.isFinite(n)) amountCents = Math.round(n * 100);
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
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

  const { data, error } = await supabase.rpc("confirm_invoice_paid", {
    p_invoice_id: invoiceId,
    p_amount: amountCents,
    p_method: method,
    p_reference: reference,
  });

  revalidatePath(`/invoices/${invoiceId}`);
  if (error) {
    redirect(`/invoices/${invoiceId}?error=${encodeURIComponent(error.message)}`);
  }

  // data is a setof (receipt_id, receipt_number)
  const receiptNumber =
    Array.isArray(data) && data[0]?.receipt_number ? data[0].receipt_number : "";

  redirect(
    `/invoices/${invoiceId}?paid=1${receiptNumber ? `&receipt=${encodeURIComponent(receiptNumber)}` : ""}`
  );
}
