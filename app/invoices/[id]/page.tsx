// app/invoices/[id]/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import BackToInvoicesLink from "@/components/BackToInvoicesLink";

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

async function getInvoice(id: string): Promise<Invoice | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

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

  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, due_at, total, currency, created_at")
    .eq("id", id)
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
  const inv = await getInvoice(params.id);

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {inv?.number ? `Invoice ${inv.number}` : "Invoice"}
          </h1>
          <div className="text-xs opacity-70 mt-1">
            {inv?.created_at
              ? `Created ${new Date(inv.created_at).toLocaleString()}`
              : "Created —"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Back button that preserves filters/sort/page/q if available */}
          <BackToInvoicesLink />
          {inv ? (
            <a
              href={`/api/receipts/${inv.id}`}
              className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              PDF
            </a>
          ) : null}
        </div>
      </div>

      {!inv ? (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
          <div className="font-medium">Invoice not found</div>
          <div className="text-xs opacity-70 mt-1">
            It may have been removed or you don’t have access.
          </div>
          <div className="mt-3">
            <BackToInvoicesLink>← Back to invoices</BackToInvoicesLink>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-4">
          <div className="text-sm">
            <div className="opacity-70">Status</div>
            <div className="font-medium">{inv.status}</div>
          </div>
          <div className="text-sm">
            <div className="opacity-70">Due</div>
            <div className="font-medium">
              {inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}
            </div>
          </div>
          <div className="text-sm">
            <div className="opacity-70">Total</div>
            <div className="font-medium">
              {typeof inv.total === "number"
                ? `${(inv.currency ?? "USD").toUpperCase()} ${(inv.total / 100).toFixed(2)}`
                : "—"}
            </div>
          </div>
          <div className="pt-2">
            <Link
              href={`/invoices/${inv.id}/download`}
              className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              Download details
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
