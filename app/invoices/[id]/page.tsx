import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import clsx from "clsx";
import StatusBadge from "@/components/StatusBadge";

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

async function getUserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { supabase: null as any, userId: null as string | null };

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

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const { supabase, userId } = await getUserSupabase();
  if (!supabase || !userId) notFound();

  // Load this user's invoice
  const { data: inv, error } = await supabase
    .from("invoices")
    .select("id, number, status, due_at, total, currency, created_at")
    .eq("user_id", userId)
    .eq("id", params.id)
    .maybeSingle();

  if (error || !inv) {
    notFound();
  }

  const currency = (inv.currency ?? "USD").toUpperCase();
  const totalFmt =
    typeof inv.total === "number" ? `${currency} ${(inv.total / 100).toFixed(2)}` : "—";
  const createdFmt = inv.created_at ? new Date(inv.created_at).toLocaleString() : "—";
  const dueFmt = inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—";

  return (
    <section className="p-6 space-y-6">
      {/* Header + Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs opacity-70">Invoice</div>
          <h1 className="text-2xl font-semibold">
            {inv.number ? `Invoice ${inv.number}` : "Invoice"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/receipts/${inv.id}`}
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Download PDF
          </a>

          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs opacity-70">Status</div>
            <div className="mt-1">
              <StatusBadge status={inv.status} dueAt={inv.due_at} />
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70">Created</div>
            <div className="mt-1 text-sm">{createdFmt}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Due</div>
            <div className={clsx("mt-1 text-sm")}>{dueFmt}</div>
          </div>
          <div className="text-right md:text-left">
            <div className="text-xs opacity-70">Total</div>
            <div className="mt-1 font-medium">{totalFmt}</div>
          </div>
        </div>
      </div>

      {/* Placeholder details (line items can come later) */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
        <div className="text-sm opacity-70">
          Line items & payment history will appear here in a later step.
        </div>
      </div>
    </section>
  );
}
