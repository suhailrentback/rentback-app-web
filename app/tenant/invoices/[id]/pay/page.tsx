// app/tenant/invoices/[id]/pay/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Invoice = {
  id: string;
  number: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  due_date: string | null;
  tenant_id: string | null;
  created_at: string;
};

function fmtAmt(cents?: number | null, ccy?: string | null) {
  const v = ((Number(cents || 0)) / 100).toFixed(2);
  return `${v} ${ccy || ""}`.trim();
}

export default async function TenantPayNowPage({
  params,
}: {
  params: { id: string };
}) {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });

  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) redirect("/not-permitted");

  // Load invoice (RLS enforces tenant scope; we also verify)
  const { data: inv, error } = await sb
    .from("invoices")
    .select("id, number, amount_cents, currency, status, due_date, tenant_id, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Pay invoice</h1>
          <Link href={`/tenant/invoices/${params.id}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
            ← Back
          </Link>
        </div>
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">Failed to load invoice: {error.message}</p>
      </div>
    );
  }
  if (!inv || inv.tenant_id !== uid) {
    redirect("/not-permitted");
  }

  const recommendedRef = inv.number || `INV-${String(inv.id).slice(0, 8)}`;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pay invoice</h1>
        <Link href={`/tenant/invoices/${inv.id}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          ← Back
        </Link>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Invoice summary</h2>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div><span className="text-gray-600">Invoice #:</span> {inv.number || "—"}</div>
          <div><span className="text-gray-600">Status:</span> {inv.status || "open"}</div>
          <div><span className="text-gray-600">Due date:</span> {inv.due_date || "—"}</div>
          <div><span className="text-gray-600">Amount:</span> {fmtAmt(inv.amount_cents, inv.currency)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Bank transfer instructions (demo)</h2>
        <ul className="list-inside list-disc text-sm text-gray-800">
          <li><strong>Beneficiary:</strong> RentBack Ltd (Demo)</li>
          <li><strong>Bank:</strong> Demo Bank</li>
          <li><strong>IBAN/Account:</strong> TBA</li>
          <li><strong>Amount:</strong> {fmtAmt(inv.amount_cents, inv.currency)}</li>
          <li><strong>Transfer reference:</strong> Use exactly <code className="rounded bg-gray-100 px-1 py-0.5">{recommendedRef}</code></li>
        </ul>
        <p className="mt-2 text-xs text-gray-600">Note: Replace bank details later. This page only records your payment so Admin can confirm it.</p>
      </div>

      <form action="/tenant/api/payments/create" method="post" className="mt-6 space-y-3 rounded-lg border p-4">
        <input type="hidden" name="invoiceId" value={inv.id} />
        <label className="block text-sm font-medium text-gray-900">
          Your transfer reference
          <input
            name="reference"
            defaultValue={recommendedRef}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="e.g. INV-12345"
          />
        </label>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Create payment record
          </button>
          <Link href="/tenant/payments" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Go to my payments
          </Link>
        </div>
        <p className="text-xs text-gray-600">
          This creates a <strong>pending</strong> payment entry. After your transfer arrives, an Admin will confirm it and your invoice will be marked paid.
        </p>
      </form>
    </div>
  );
}
