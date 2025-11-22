// app/landlord/invoices/[id]/edit/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function moneyDisplay(cents?: number | null, curr?: string | null) {
  if (cents == null) return "";
  const v = Number(cents) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: (curr || "PKR").toUpperCase() })
      .format(v)
      .replace(/[^\d.,-]/g, "");
  } catch {
    return String(v.toFixed(2));
  }
}

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get: (n: string) => jar.get(n)?.value,
      set() {},
      remove() {},
    },
  });

  const { data, error } = await sb
    .from("invoices")
    .select("id, number, amount_cents, currency, status, description, due_date")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Edit Invoice</h1>
        <p className="mt-4 text-sm text-red-600">Failed to load invoice.</p>
        <Link href="/landlord" className="mt-6 inline-block rounded-xl border px-4 py-2 hover:bg-gray-50">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-xl font-semibold">Edit Invoice</h1>
      <form
        method="POST"
        action={`/landlord/api/invoices/${data.id}/update`}
        className="mt-6 space-y-4 rounded-2xl border p-4"
      >
        <div>
          <label className="block text-sm font-medium">Invoice #</label>
          <input
            readOnly
            defaultValue={String(data.number)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={moneyDisplay(data.amount_cents, data.currency)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Currency: {(data.currency || "PKR").toUpperCase()}</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            defaultValue={data.description || ""}
            rows={3}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            name="status"
            defaultValue={(data.status || "OPEN").toUpperCase()}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="OPEN">OPEN</option>
            <option value="PAID">PAID</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Due date</label>
          <input
            type="date"
            name="due_date"
            defaultValue={data.due_date ? String(data.due_date).slice(0, 10) : ""}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link href="/landlord" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
            Cancel
          </Link>
          <button className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">Save</button>
        </div>
      </form>
    </div>
  );
}
