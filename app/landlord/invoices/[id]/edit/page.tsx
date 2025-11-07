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
  total_amount: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
};

const ALLOWED_STATUS = ["issued", "paid", "overdue"] as const;

function dateInputValue(s?: string | null) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  // yyyy-mm-dd (UTC)
  return d.toISOString().slice(0, 10);
}

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createRouteSupabase();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, description, status, total_amount, currency, issued_at, due_date"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const inv = data as InvoiceRow;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit invoice {inv.number ?? inv.id.slice(0, 8).toUpperCase()}
        </h1>
        <Link
          href="/landlord/invoices"
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to list
        </Link>
      </div>

      <form
        method="post"
        action={`/api/landlord/invoices/${inv.id}/update`}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Number</span>
            <input
              name="number"
              type="text"
              defaultValue={inv.number ?? ""}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="e.g. INV-000123"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Status</span>
            <select
              name="status"
              defaultValue={(inv.status ?? "issued").toLowerCase()}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              {ALLOWED_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-gray-700">Description</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={inv.description ?? ""}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Short description (shown to tenant)"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">
              Total amount
            </span>
            <input
              name="total_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                typeof inv.total_amount === "number" ? inv.total_amount : 0
              }
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Currency</span>
            <input
              name="currency"
              type="text"
              defaultValue={(inv.currency ?? "PKR").toUpperCase()}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              maxLength={3}
              placeholder="PKR"
            />
          </label>

          <div />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Issued on</span>
            <input
              name="issued_at"
              type="date"
              defaultValue={dateInputValue(inv.issued_at)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Due on</span>
            <input
              name="due_date"
              type="date"
              defaultValue={dateInputValue(inv.due_date)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl border bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Save changes
          </button>
          <Link
            href="/landlord/invoices"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
