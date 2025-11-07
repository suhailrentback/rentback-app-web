// app/landlord/invoices/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

type InvoiceRow = {
  id: string;
  number: string | null;
  description: string | null;
  status: string | null; // 'open' | 'paid' (per current enum)
  issued_at: string | null; // ISO or date
  due_date: string | null;
  total_amount: number | null;
  amount_cents: number | null;
  currency: string | null;
};

export const dynamic = "force-dynamic";

function toDateInputValue(d: string | null): string {
  if (!d) return "";
  // Normalize to YYYY-MM-DD without tz drift
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  // Fetch the invoice (RLS ensures staff/admin access only)
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "id, number, description, status, issued_at, due_date, total_amount, amount_cents, currency"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !invoice) notFound();

  const inv = invoice as InvoiceRow;

  const issuedVal = toDateInputValue(inv.issued_at);
  const dueVal = toDateInputValue(inv.due_date);
  const amt =
    typeof inv.total_amount === "number"
      ? inv.total_amount
      : typeof inv.amount_cents === "number"
      ? Math.round(inv.amount_cents) / 100
      : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Landlord
          </div>
          <h1 className="text-2xl font-semibold">Edit invoice</h1>
          <p className="text-sm text-gray-600">
            Update description, dates, status, and amount.
          </p>
        </div>
        <Link
          href="/landlord/invoices"
          className="text-sm underline underline-offset-4 hover:opacity-80"
        >
          Back to invoices
        </Link>
      </div>

      <form
        method="post"
        action={`/api/landlord/invoices/${inv.id}/update`}
        className="space-y-5 rounded-xl border p-4"
      >
        <div>
          <label className="block text-xs text-gray-600">Invoice number</label>
          <input
            type="text"
            name="number"
            defaultValue={inv.number ?? ""}
            placeholder="e.g., INV-2025-0001"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional label visible to tenants.
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-600">Description</label>
          <textarea
            name="description"
            defaultValue={inv.description ?? ""}
            rows={3}
            placeholder="e.g., October rent"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs text-gray-600">Status</label>
            <select
              name="status"
              defaultValue={(inv.status ?? "open").toLowerCase()}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="open">Open</option>
              <option value="paid">Paid</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Only allowed values right now: <b>open</b> or <b>paid</b>.
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-600">Issued date</label>
            <input
              type="date"
              name="issued_at"
              defaultValue={issuedVal}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600">Due date</label>
            <input
              type="date"
              name="due_date"
              defaultValue={dueVal}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600">Total amount</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              name="total_amount"
              defaultValue={String(amt)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600">Currency</label>
            <input
              type="text"
              name="currency"
              maxLength={8}
              defaultValue={(inv.currency ?? "PKR").toUpperCase()}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm uppercase"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/landlord/invoices"
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
