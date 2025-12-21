'use client';

import Link from 'next/link';
import StatusBadge from './StatusBadge';

type Row = {
  id: string;
  number: string | null;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

export default function InvoiceListMobile({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-3">
      {rows.map((inv) => (
        <Link
          key={inv.id}
          href={`/invoices/${inv.id}`}
          className="block rounded-2xl border border-black/10 dark:border-white/10 p-4 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="font-medium">{inv.number ?? '—'}</div>
            <StatusBadge status={inv.status} dueAt={inv.due_at} />
          </div>
          <div className="mt-1 text-xs opacity-70">
            {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
            {inv.due_at ? ` • Due ${new Date(inv.due_at).toLocaleDateString()}` : ''}
          </div>
          <div className="mt-2 text-sm font-medium text-right">
            {typeof inv.total === 'number'
              ? `${(inv.currency ?? 'USD').toUpperCase()} ${(inv.total / 100).toFixed(2)}`
              : '—'}
          </div>
        </Link>
      ))}
    </div>
  );
}
