// app/landlord/invoices/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  number: string | null;
  description: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
};

const ALLOWED_STATUS = ["draft", "open", "issued", "paid", "overdue"] as const;

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createRouteSupabase();
  const { id } = params;

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, description, status, total_amount, currency, issued_at, due_date"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const inv = data as Row;
  const amt =
    typeof inv.total_amount === "number" ? inv.total_amount : 0;
  const cur = (inv.currency ?? "PKR").toUpperCase();
  const issued = inv.issued_at ? new Date(inv.issued_at).toDateString() : "—";
  const dueISO = inv.due_date ? inv.due_date.slice(0, 10) : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href="/landlord" className="text-blue-600 hover:underline">
          ← Back to landlord
        </Link>
        <Link href="/landlord/invoices" className="text-blue-600 hover:underline">
          All invoices
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        Edit Invoice {inv.number ?? inv.id.slice(0, 8).toUpperCase()}
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Issued: {issued}
      </p>

      <form
        method="post"
        action={`/api/landlord/invoices/${inv.id}/update`}
        className="space-y-4 rounded-2xl border bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            name="status"
            defaultValue={inv.status ?? "open"}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            {ALLOWED_STATUS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Due date</label>
          <input
            type="date"
            name="due_date"
            defaultValue={dueISO}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium">Amount</label>
            <input
              type="number"
              step="0.01"
              name="total_amount"
              defaultValue={amt}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Currency</label>
            <input
              type="text"
              name="currency"
              maxLength={3}
              defaultValue={cur}
              className="w-full rounded-xl border px-3 py-2 text-sm uppercase"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={inv.description ?? ""}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/landlord/invoices"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-xl border bg-black px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Save changes
          </button>
        </div>

        {/* tiny hint */}
        <p className="mt-2 text-xs text-gray-500">
          Updates require landlord/staff RLS permission. If you see a “not allowed” error after redirect, your database policy may need the update policy for staff/admin.
        </p>
      </form>
    </div>
  );
}
