// app/tenant/invoices/[id]/pay/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function PayInvoicePage({ params }: { params: { id: string } }) {
  const invoiceId = params.id;
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  // Must be signed in
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) notFound();

  // Load your invoice (tenant-scoped)
  const { data: inv } = await supabase
    .from("invoices")
    .select("id, number, status, total_amount, currency, tenant_id, due_date, issued_at")
    .eq("id", invoiceId)
    .eq("tenant_id", me.user.id)
    .maybeSingle();

  if (!inv) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4">
        <Link href={`/tenant/invoices/${invoiceId}`} className="text-sm underline hover:no-underline">
          ← Back to invoice
        </Link>
      </div>

      <h1 className="mb-2 text-xl font-semibold">Pay invoice {inv.number}</h1>
      <p className="mb-6 text-sm text-gray-600">
        Enter the amount you’ve paid and the bank transfer reference (or receipt number). We’ll record this payment and an
        admin can confirm it later.
      </p>

      <form
        action={`/api/tenant/invoices/${invoiceId}/pay`}
        method="post"
        className="space-y-4 rounded-2xl border p-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Amount ({inv.currency || "PKR"})</label>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            placeholder={(Number(inv.total_amount ?? 0)).toFixed(2)}
            required
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Suggested: {(Number(inv.total_amount ?? 0)).toFixed(2)} {inv.currency || "PKR"}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Reference</label>
          <input
            type="text"
            name="reference"
            placeholder="e.g., Bank transfer ref ABC123"
            required
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Submit payment
        </button>
      </form>
    </div>
  );
}
