// app/landlord/invoices/new/page.tsx
import NewInvoiceForm from "@/components/NewInvoiceForm";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getSupabaseForServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { supabase: null, userId: null as string | null, error: "Supabase env not set" };
  }
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
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;
  return { supabase, userId, error: null as string | null };
}

/** Server action that creates a draft or issues an invoice */
async function createInvoiceAction(formData: FormData) {
  "use server";

  const { supabase, userId, error } = await getSupabaseForServer();
  if (!supabase || !userId) {
    return { ok: false, error: error ?? "Not signed in" };
  }

  const intent = (formData.get("intent")?.toString() ?? "draft").toLowerCase();
  const number = formData.get("number")?.toString().trim() || null;
  const currency = (formData.get("currency")?.toString() || "USD").toUpperCase();
  const dueAtStr = formData.get("due_at")?.toString() || "";
  const due_at = dueAtStr ? new Date(dueAtStr).toISOString() : null;

  // Parse items JSON posted by the client form
  let items: Array<{ description: string; qty: number; unit_price: number }> = [];
  try {
    const raw = formData.get("items")?.toString() || "[]";
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    /* ignore, fallback to [] */
  }

  // Sanitize items
  items = items
    .map((i) => ({
      description: (i.description ?? "").toString().slice(0, 200),
      qty: Number(i.qty) || 0,
      unit_price: Number(i.unit_price) || 0, // integer cents
    }))
    .filter((i) => i.qty > 0 && i.unit_price >= 0);

  const total = items.reduce((acc, i) => acc + Math.round(i.qty * i.unit_price), 0); // cents
  const status = intent === "issue" ? "ISSUED" : "DRAFT";

  // Insert invoice
  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      number,
      status,
      due_at,
      total,
      currency,
    })
    .select("id")
    .single();

  if (invErr || !inv) {
    return { ok: false, error: invErr?.message || "Failed to create invoice" };
  }

  // Insert invoice_items if table exists (best-effort)
  if (items.length > 0) {
    try {
      await supabase
        .from("invoice_items")
        .insert(
          items.map((it) => ({
            invoice_id: inv.id,
            description: it.description,
            qty: it.qty,
            unit_price: it.unit_price, // cents
            currency,
          }))
        );
    } catch {
      // ignore if table not present yet
    }
  }

  // Make sure the lists refresh, then jump to detail page
  revalidatePath("/invoices");
  redirect(`/invoices/${inv.id}`);
}

export default async function NewInvoicePage() {
  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
      </div>
      <NewInvoiceForm action={createInvoiceAction} />
    </section>
  );
}
