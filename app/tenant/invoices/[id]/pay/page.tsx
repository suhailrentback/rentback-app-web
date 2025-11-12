// app/tenant/invoices/[id]/pay/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type InvoiceRow = {
  id: string;
  number: string | null;
  tenant_id: string | null;
  status: string | null;
  currency: string | null;
  amount_cents: number | null;
  due_date: string | null;
};

export default async function TenantPayPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) notFound();

  // RLS will already scope this to tenant; still fine if it returns null
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, number, tenant_id, status, currency, amount_cents, due_date")
    .eq("id", params.id)
    .maybeSingle<InvoiceRow>();

  if (error || !invoice) notFound();

  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  const amount = Math.max(0, Math.round((invoice.amount_cents ?? 0) / 100));
  const currency = invoice.currency ?? "PKR";

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="mb-4">
        <Link href={`/tenant/invoices/${invoice.id}`} className="text-sm underline hover:no-underline">
          ← Back to invoice
        </Link>
      </div>

      <div className="rounded-2xl border p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-1">
          Pay invoice {invoice.number ?? invoice.id.slice(0, 8)}
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Enter your payment reference and the amount you sent. We’ll notify your landlord and
          you’ll see this under Payments. An admin/staff user will mark it as confirmed.
        </p>

        {isPaid ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            This invoice is already marked as PAID.
          </div>
        ) : null}

        <form action="/tenant/api/payments/create" method="POST" className="space-y-4">
          <input type="hidden" name="invoiceId" value={invoice.id} />

          <div>
            <label className="mb-1 block text-sm font-medium">Payment reference</label>
            <input
              name="reference"
              required
              maxLength={80}
              placeholder="e.g., Bank transfer ref, Slip #"
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Amount</label>
            <div className="flex gap-2">
              <input
                name="amount"
                type="number"
                step="1"
                min="1"
                required
                defaultValue={amount}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <span className="inline-flex items-center rounded-xl border px-3 text-sm">{currency}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Defaulted to full invoice total. Adjust only if you paid a different amount.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              disabled={isPaid}
              title={isPaid ? "Invoice already paid" : "Submit payment"}
            >
              Submit payment
            </button>
            <Link
              href={`/tenant/invoices/${invoice.id}`}
              className="text-sm underline hover:no-underline"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Submitting creates a payment record with status <strong>submitted</strong>. Once verified,
        it will be marked <strong>confirmed</strong> and you’ll get a receipt.
      </p>
    </div>
  );
}
