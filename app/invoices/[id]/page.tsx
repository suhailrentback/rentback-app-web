// app/invoices/[id]/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { createServerClient } from "@supabase/ssr";

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default async function InvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: () => cookieStore,
  });

  // Fetch the one invoice the logged-in user is allowed to see (RLS should enforce)
  const { data: inv, error } = await supabase
    .from("invoices")
    .select("id, number, status, due_at, total, currency, created_at, updated_at")
    .eq("id", params.id)
    .single();

  if (error || !inv) {
    // If RLS blocks or missing, show 404
    return notFound();
  }

  const money = formatMoney(inv.total, inv.currency);

  return (
    <section className="px-6 py-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Invoice {inv.number ? `#${inv.number}` : `(${inv.id.slice(0, 8)}…)`}
          </h1>
          <p className="text-sm opacity-70">
            Created {inv.created_at ? new Date(inv.created_at).toLocaleString() : "—"}
          </p>
        </div>
        <StatusBadge status={inv.status} dueAt={inv.due_at} />
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-5 space-y-3">
        <Row label="Invoice ID" value={inv.id} />
        <Row
          label="Due"
          value={inv.due_at ? new Date(inv.due_at).toLocaleString() : "—"}
        />
        <Row label="Total" value={money} />
        <Row
          label="Last updated"
          value={inv.updated_at ? new Date(inv.updated_at).toLocaleString() : "—"}
        />
      </div>

      <div className="flex items-center gap-3">
        <a
          href={`/api/receipts/${inv.id}`}
          className="rounded-xl px-4 py-2 text-sm font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
        >
          Download PDF
        </a>

        {inv.status !== "PAID" ? (
          <button
            disabled
            title="Payment integration coming soon"
            className="rounded-xl px-4 py-2 text-sm font-medium border border-black/10 dark:border-white/20 opacity-60"
          >
            Pay now (coming soon)
          </button>
        ) : null}

        <div className="ml-auto">
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-2 text-sm border hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back to invoices
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function formatMoney(amount: number | null, currency: string | null) {
  if (typeof amount !== "number") return "—";
  const c = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(
      amount
    );
  } catch {
    return `${c} ${amount.toFixed(2)}`;
  }
}
