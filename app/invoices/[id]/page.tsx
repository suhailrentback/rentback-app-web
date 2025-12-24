// app/invoices/[id]/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import StatusBadge from "@/components/StatusBadge";
import IssueInvoiceButton from "@/components/IssueInvoiceButton";

type PageParams = { params: { id: string } };

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
type Invoice = {
  id: string;
  number: string | null;
  status: InvoiceStatus;
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
  landlord_id: string | null;
  user_id: string | null;
};

export default async function InvoiceDetailPage({ params }: PageParams) {
  const id = params.id;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  // Load invoice
  const { data: inv, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, due_at, total, currency, created_at, landlord_id, user_id"
    )
    .eq("id", id)
    .single<Invoice>();

  if (error || !inv) {
    return (
      <section className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Invoice</h1>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
          Not found.
        </div>
      </section>
    );
  }

  // Viewer checks (basic): allow both tenant (user_id) and landlord to view
  const viewerIsOwner = userId && (userId === inv.user_id || userId === inv.landlord_id);
  if (!viewerIsOwner) {
    return (
      <section className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Invoice</h1>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
          You do not have access to this invoice.
        </div>
      </section>
    );
  }

  const canIssue = userId === inv.landlord_id && inv.status === "DRAFT";

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Invoice {inv.number ? `#${inv.number}` : "—"}
        </h1>
        <div className="flex items-center gap-3">
          {canIssue ? (
            <IssueInvoiceButton invoiceId={inv.id} />
          ) : null}
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm opacity-70">Status</div>
            <StatusBadge status={inv.status} dueAt={inv.due_at} />
          </div>
          <div className="space-y-1 text-right">
            <div className="text-sm opacity-70">Total</div>
            <div className="text-lg font-medium tabular-nums">
              {typeof inv.total === "number"
                ? `${(inv.currency ?? "USD").toUpperCase()} ${(inv.total / 100).toFixed(2)}`
                : "—"}
            </div>
          </div>
        </div>
        <div className="border-t border-black/10 dark:border-white/10 p-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="opacity-70">Created</div>
            <div>{inv.created_at ? new Date(inv.created_at).toLocaleString() : "—"}</div>
          </div>
          <div>
            <div className="opacity-70">Due</div>
            <div>{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
