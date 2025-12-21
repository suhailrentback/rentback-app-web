'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';

export type StatusFilterKey = 'all' | 'unpaid' | 'overdue' | 'paid';

export default function StatusFilters({
  value,
}: {
  value?: StatusFilterKey;
}) {
  const sp = useSearchParams();
  const q = sp.get('q') ?? undefined;
  const sort = sp.get('sort') ?? undefined;
  const dir = sp.get('dir') ?? undefined;
  const page = sp.get('page') ?? undefined;

  const items: { key: StatusFilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unpaid', label: 'Unpaid' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'paid', label: 'Paid' },
  ];

  const build = (key: StatusFilterKey) => {
    const params = new URLSearchParams();
    if (key !== 'all') params.set('status', key);
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    if (dir) params.set('dir', dir);
    if (page) params.set('page', page);
    const qs = params.toString();
    return '/invoices' + (qs ? `?${qs}` : '');
    };

  const current = value ?? ((sp.get('status') as StatusFilterKey) || 'all');

  return (
    <div className="flex items-center gap-2">
      {items.map(it => (
        <Link
          key={it.key}
          href={build(it.key)}
          className={clsx(
            'rounded-xl px-3 py-1.5 border text-xs',
            'hover:bg-black/5 dark:hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black',
            current === it.key
              ? 'bg-black/5 dark:bg-white/10'
              : 'bg-transparent'
          )}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}
