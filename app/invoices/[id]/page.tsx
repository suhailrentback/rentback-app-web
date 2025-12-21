import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import StatusBadge from '@/components/StatusBadge';

type Invoice = {
  id: string;
  number: string | null;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
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

export default async function InvoiceDetail({
  params,
}: {
  params: { id: string };
}) {
  const { supabase, userId } = await getUserSupabase();
  if (!supabase || !userId) {
    return (
      <section className="p-6">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
          <div className="font-medium">Not signed in</div>
          <div className="text-sm opacity-70">Please log in to view invoices.</div>
        </div>
      </section>
    );
  }

  const { data: rows, error } = await supabase
    .from('invoices')
    .select('id, number, status, due_at, total, currency, created_at')
    .eq('user_id', userId)
    .eq('id', params.id)
    .limit(1);

  const inv = (rows?.[0] ?? null) as Invoice | null;

  if (error || !inv) {
    throw new Error('Invoice not found');
  }

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Invoice {inv.number ?? '—'}
        </h1>
        <div className="flex items-center gap-2">
          <a
            href={`/api/receipts/${inv.id}`}
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Download PDF
          </a>
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

      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="opacity-60">Status</div>
            <div className="mt-1"><StatusBadge status={inv.status} dueAt={inv.due_at} /></div>
          </div>
          <div>
            <div className="opacity-60">Created</div>
            <div className="mt-1">{inv.created_at ? new Date(inv.created_at).toLocaleString() : '—'}</div>
          </div>
          <div>
            <div className="opacity-60">Due</div>
            <div className="mt-1">{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="opacity-60">Total</div>
            <div className="mt-1 font-medium">
              {typeof inv.total === 'number'
                ? `${(inv.currency ?? 'USD').toUpperCase()} ${(inv.total / 100).toFixed(2)}`
                : '—'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
