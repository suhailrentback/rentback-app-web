// app/invoices/[id]/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import StatusBadge from "@/components/StatusBadge";
import { notFound } from "next/navigation";

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

export default async function InvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return notFound();

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

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  if (!userId) return notFound();

  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, due_at, total, currency, created_at")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return notFound();
  const inv = data as Invoice;

  const formattedTotal =
    typeof inv.total === "number"
      ? `${(inv.currency ?? "USD").toUpperCase()} ${(inv.total / 100).toFixed(
          2
        )}`
      : "—";

  const created = inv.created_at
    ? new Date(inv.created_at).toLocaleString()
    : "—";
  const due = inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—";

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold">
            Invoice {inv.number ?? `#${inv.id.slice(0, 8)}`}
          </h1>
        </div>

        <a
          href={`/api/receipts/${inv.id}`}
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          Download PDF
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2">
          <div className="text-xs opacity-70">Status</div>
          <StatusBadge status={inv.status} dueAt={inv.due_at} />
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2">
          <div className="text-xs opacity-70">Created</div>
          <div className="font-medium">{created}</div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2">
          <div className="text-xs opacity-70">Due</div>
          <div className="font-medium">{due}</div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2 md:col-span-3">
          <div className="text-xs opacity-70">Total</div>
          <div className="text-xl font-semibold tabular-nums">
            {formattedTotal}
          </div>
        </div>
      </div>
    </section>
  );
}
