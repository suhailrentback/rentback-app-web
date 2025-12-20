// app/invoices/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import StatusBadge from "@/components/StatusBadge";
import clsx from "clsx";

type Invoice = {
  id: string;
  user_id?: string | null;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
  // add any other columns you may have later (e.g., description, notes)
};

async function getUserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { supabase: null, userId: null as string | null };

  const cookieStore = cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });

  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;
  return { supabase, userId };
}

async function fetchInvoice(id: string): Promise<Invoice | null> {
  const { supabase, userId } = await getUserSupabase();
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("invoices")
    .select("id, user_id, number, status, due_at, total, currency, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Invoice;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await fetchInvoice(params.id);
  if (!invoice) {
    notFound();
  }

  const currency = (invoice.currency ?? "USD").toUpperCase();
  const amount =
    typeof invoice.total === "number"
      ? `${currency} ${(invoice.total / 100).toFixed(2)}`
      : "—";

  const created =
    invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "—";
  const due =
    invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : "—";

  const title = invoice.number ? `Invoice ${invoice.number}` : "Invoice";

  return (
    <section className="p-6 space-y-6">
      {/* Breadcrumb for orientation */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link
              href="/invoices"
              className="rounded px-2 py-1 border hover:bg-black/5 dark:hover:bg-white/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              Invoices
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="opacity-70">
            {title}
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1
            tabIndex={-1}
            className="text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                       focus:ring-offset-white dark:focus:ring-offset-black rounded"
          >
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={invoice.status} dueAt={invoice.due_at} />
            <span className="opacity-60" aria-label="Created date">
              Created: {created}
            </span>
            <span className="opacity-60" aria-label="Due date">
              • Due: {due}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/receipts/${invoice.id}`}
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            aria-label="Download PDF receipt"
          >
            PDF
          </a>
          {/* Future: Pay button, etc. */}
        </div>
      </header>

      {/* Summary card */}
      <div
        className={clsx(
          "rounded-2xl border border-black/10 dark:border-white/10 p-6",
          "bg-white/60 dark:bg-white/5"
        )}
        role="group"
        aria-label="Invoice summary"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs opacity-70">Amount</div>
            <div className="text-lg font-medium">{amount}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Status</div>
            <div className="mt-1">
              <StatusBadge status={invoice.status} dueAt={invoice.due_at} />
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70">Due</div>
            <div className="text-lg font-medium">{due}</div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div
        className="rounded-2xl border border-black/10 dark:border-white/10 p-6"
        role="region"
        aria-label="Metadata"
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="opacity-70">Invoice ID</dt>
            <dd className="font-medium break-all">{invoice.id}</dd>
          </div>
          <div>
            <dt className="opacity-70">Number</dt>
            <dd className="font-medium">{invoice.number ?? "—"}</dd>
          </div>
          <div>
            <dt className="opacity-70">Created</dt>
            <dd className="font-medium">{created}</dd>
          </div>
          <div>
            <dt className="opacity-70">Currency</dt>
            <dd className="font-medium">{currency}</dd>
          </div>
        </dl>
      </div>

      {/* Back link for keyboard users */}
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 border text-sm
                     hover:bg-black/5 dark:hover:bg-white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          ← Back to invoices
        </Link>
      </div>
    </section>
  );
}
