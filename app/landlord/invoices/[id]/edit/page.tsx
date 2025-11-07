// app/landlord/invoices/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type InvoiceRow = {
  id: string;
  number: string | null;
  description: string | null;
  status: string | null;
  issued_at: string | null;
  due_date: string | null;
  total_amount: number | null;
  amount_cents: number | null;
  currency: string | null;
};

const ALLOWED_STATUS = ["open", "issued", "paid", "overdue", "draft"] as const;

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createRouteSupabase();
  const { id } = params;

  const { data: inv, error } = await supabase
    .from("invoices")
    .select(
      "id, number, description, status, issued_at, due_date, total_amount, amount_cents, currency"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !inv) {
    return notFound();
  }

  const title = inv.number ?? inv.id.slice(0, 8).toUpperCase();
  const amount =
    typeof inv.total_amount === "number"
      ? inv.total_amount
      : typeof inv.amount_cents === "number"
      ? Math.round(inv.amount_cents) / 100
      : 0;
  const currency = (inv.currency ?? "PKR").toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-3 text-sm">
        <Link href="/landlord" className="text-blue-600 hover:underline">
          ← Back to landlord
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        Edit invoice <span className="text-gray-500">#{title}</span>
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Update amount, currency, description, or status. Changes respect RLS.
      </p>

      <form
        action={`/api/landlord/invoices/${inv.id}/update`}
        method="post"
        className="mt-6 space-y-5 rounded-2xl border bg-white p-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-800">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            required
            defaultValue={amount}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter the total amount in {currency}.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Currency (ISO 4217)
          </label>
          <input
            type="text"
            name="currency"
            maxLength={3}
            defaultValue={currency}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={inv.description ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">
            Status
          </label>
          <select
            name="status"
            defaultValue={String(inv.status ?? "open").toLowerCase()}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          >
            {ALLOWED_STATUS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Allowed: {ALLOWED_STATUS.map((s) => s.toUpperCase()).join(", ")}.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/landlord"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
