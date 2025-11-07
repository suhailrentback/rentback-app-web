// app/landlord/invoices/page.tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

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

export const dynamic = "force-dynamic";

function amountDisplay(total_amount: number | null | undefined, amount_cents: number | null | undefined, currency: string | null | undefined) {
  const amt =
    typeof total_amount === "number"
      ? total_amount
      : typeof amount_cents === "number"
      ? Math.round(amount_cents) / 100
      : 0;
  return `${amt} ${currency ?? "PKR"}`;
}

export default async function LandlordInvoicesPage() {
  const supabase = createServerSupabase();

  const { data: rows, error } = await supabase
    .from("invoices")
    .select(
      "id, number, description, status, issued_at, due_date, total_amount, amount_cents, currency"
    )
    .order("issued_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Landlord
          </div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-gray-600">
            Create, review, and edit invoices.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/landlord"
            className="text-sm underline underline-offset-4 hover:opacity-80"
          >
            Dashboard
          </Link>
          <Link
            href="/landlord/invoices/new"
            className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Create invoice
          </Link>
        </div>
      </div>

      <div className="rounded-xl border">
        <div className="grid grid-cols-12 gap-2 border-b bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <div className="col-span-3">Invoice</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Issued</div>
          <div className="col-span-2">Due</div>
          <div className="col-span-3 text-right">Amount</div>
        </div>

        {error ? (
          <div className="px-4 py-8 text-sm text-red-600">
            Couldn’t load invoices. Please try again.
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="px-4 py-10 text-sm">
            <div className="mb-1 font-medium">No invoices yet</div>
            <div className="text-gray-600">
              Use “Create invoice” to add your first one.
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {(rows as InvoiceRow[]).map((inv) => {
              const number = inv.number ?? inv.id.slice(0, 8).toUpperCase();
              const issued = inv.issued_at ? new Date(inv.issued_at).toDateString() : "—";
              const due = inv.due_date ? new Date(inv.due_date).toDateString() : "—";
              const amount = amountDisplay(inv.total_amount, inv.amount_cents, inv.currency);

              return (
                <li key={inv.id} className="grid grid-cols-12 gap-2 px-3 py-3">
                  <div className="col-span-3">
                    <div className="font-medium">#{number}</div>
                    <div className="text-xs text-gray-600 line-clamp-1">
                      {inv.description ?? "—"}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
                      {(inv.status ?? "").toLowerCase() || "—"}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm">{issued}</div>
                  <div className="col-span-2 text-sm">{due}</div>
                  <div className="col-span-3 flex items-center justify-end gap-2 text-sm">
                    <span>{amount}</span>
                    <Link
                      href={`/landlord/invoices/${inv.id}/edit`}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
