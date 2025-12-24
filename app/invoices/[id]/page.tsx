import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import StatusBadge from "@/components/StatusBadge";
import { confirmPaid } from "./actions";

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null; // cents
  currency: string | null;
  created_at: string | null;
};

function getSb() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}

export default async function InvoiceDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const id = params.id;

  const supabase = getSb();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;

  if (!userId) {
    return (
      <section className="p-6">
        <div className="text-sm opacity-70">Please sign in to view this invoice.</div>
      </section>
    );
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, due_at, total, currency, created_at")
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <section className="p-6">
        <div className="font-medium">Invoice not found</div>
        <div className="mt-3">
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back to invoices
          </Link>
        </div>
      </section>
    );
  }

  const inv = data as Invoice;
  const errorMsg =
    typeof searchParams?.error === "string" ? decodeURIComponent(searchParams.error) : null;
  const paidOk = String(searchParams?.paid || "") === "1";
  const receiptNo =
    typeof searchParams?.receipt === "string" ? decodeURIComponent(searchParams.receipt) : null;

  const totalMajor =
    typeof inv.total === "number" ? (inv.total / 100).toFixed(2) : undefined;

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {inv.number ? `Invoice ${inv.number}` : "Invoice"}
          </h1>
          <div className="text-xs opacity-70">
            Created {inv.created_at ? new Date(inv.created_at).toLocaleString() : "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={inv.status} dueAt={inv.due_at} />
          <a
            href={`/api/receipts/${inv.id}`}
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            PDF
          </a>
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back
          </Link>
        </div>
      </div>

      {paidOk && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="text-sm">
            Payment confirmed. {receiptNo ? <>Receipt <span className="font-mono">{receiptNo}</span> created.</> : null}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="text-sm">Error: {errorMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
          <div className="text-xs opacity-70">Status</div>
          <div className="mt-1">
            <StatusBadge status={inv.status} dueAt={inv.due_at} />
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
          <div className="text-xs opacity-70">Total</div>
          <div className="mt-1 text-lg font-medium">
            {typeof inv.total === "number"
              ? `${(inv.currency ?? "USD").toUpperCase()} ${totalMajor}`
              : "—"}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
          <div className="text-xs opacity-70">Due</div>
          <div className="mt-1">
            {inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}
          </div>
        </div>
      </div>

      {/* Mark as Paid form shown only when not already PAID */}
      {inv.status !== "PAID" && (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
          <div className="font-medium mb-3">Mark as Paid</div>
          <form action={confirmPaid} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="hidden" name="invoice_id" value={inv.id} />
            <label className="block">
              <span className="text-xs opacity-70">Amount (major)</span>
              <input
                type="number"
                step="0.01"
                name="amount"
                defaultValue={totalMajor ?? ""}
                placeholder="e.g., 499.99"
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
              />
            </label>
            <label className="block">
              <span className="text-xs opacity-70">Method</span>
              <select
                name="method"
                defaultValue="cash"
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs opacity-70">Reference (optional)</span>
              <input
                type="text"
                name="reference"
                placeholder="e.g., Bank Txn ID, memo"
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
              />
            </label>

            <div className="md:col-span-4">
              <button
                type="submit"
                className="rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                Confirm Payment
              </button>
            </div>
          </form>
          <div className="text-xs opacity-70 mt-2">
            On confirm: invoice status → <span className="font-mono">PAID</span>, receipt row is
            created, and this page refreshes with a success banner.
          </div>
        </div>
      )}
    </section>
  );
}
