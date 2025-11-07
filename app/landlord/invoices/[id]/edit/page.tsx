// app/landlord/invoices/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type InvoiceRow = {
  id: string;
  number: string | null;
  description: string | null;
  currency: string | null;
  total_amount: number | null;
  issued_at: string | null;
  due_date: string | null;
  status: string | null;
};

function fmtDateInput(s?: string | null) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  // yyyy-mm-dd
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createRouteSupabase();
  const { id } = params;
  const ok = (searchParams.ok ?? "").toString() === "1";

  // Load existing invoice (RLS: staff/admin can read all)
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, description, currency, total_amount, issued_at, due_date, status"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const inv = data as InvoiceRow;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Invoice {inv.number ? `#${inv.number}` : ""}
        </h1>
        <Link
          href="/landlord"
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to Landlord
        </Link>
      </div>

      {ok && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Saved.
        </div>
      )}

      <form
        method="post"
        action={`/api/landlord/invoices/${inv.id}/update`}
        className="space-y-4 rounded-2xl border p-5"
      >
        <input
          type="hidden"
          name="redirect"
          value={`/landlord/invoices/${inv.id}/edit?ok=1`}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 text-gray-600">Invoice number (optional)</div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              name="number"
              defaultValue={inv.number ?? ""}
              placeholder="e.g. INV-2025-001"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-600">Currency</div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm uppercase"
              name="currency"
              defaultValue={(inv.currency ?? "PKR").toUpperCase()}
              placeholder="PKR"
              maxLength={3}
            />
          </label>
        </div>

        <label className="block text-sm">
          <div className="mb-1 text-gray-600">Description</div>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            name="description"
            defaultValue={inv.description ?? ""}
            placeholder="e.g. October rent"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="mb-1 text-gray-600">Total amount</div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              name="total_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={typeof inv.total_amount === "number" ? inv.total_amount : 0}
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-600">Issued at</div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={fmtDateInput(inv.issued_at)}
              disabled
              readOnly
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-600">Due date</div>
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              type="date"
              name="due_date"
              defaultValue={fmtDateInput(inv.due_date)}
            />
          </label>
        </div>

        <label className="block text-sm">
          <div className="mb-1 text-gray-600">Status</div>
          <select
            className="w-full rounded-xl border px-3 py-2 text-sm"
            name="status"
            defaultValue={(inv.status ?? "open").toLowerCase()}
          >
            {["open", "issued", "paid", "overdue"].map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
