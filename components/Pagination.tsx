'use client';

import Link from 'next/link';
import clsx from 'clsx';

import type { SortDir, SortKey } from './SortControls';

type Props = {
  page: number;
  totalPages: number;
  status?: string | undefined;
  q?: string | undefined;
  sort?: SortKey | undefined;
  dir?: SortDir | undefined;
};

function buildHref(
  p: number,
  { status, q, sort, dir }: { status?: string; q?: string; sort?: SortKey; dir?: SortDir }
) {
  const params = new URLSearchParams();
  if (p > 1) params.set('page', String(p));
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);
  if (dir) params.set('dir', dir);
  const qs = params.toString();
  return '/invoices' + (qs ? `?${qs}` : '');
}

function calcPages(page: number, total: number): (number | '...')[] {
  const out: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) out.push(i);
    return out;
  }
  const add = (v: number | '...') => out.push(v);
  add(1);
  if (page > 3) add('...');
  for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) add(i);
  if (page < total - 2) add('...');
  add(total);
  return out;
}

export default function Pagination({ page, totalPages, status, q, sort, dir }: Props) {
  if (totalPages <= 1) return null;
  const pages = calcPages(page, totalPages);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1" aria-label="Pagination">
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`e-${idx}`} className="px-2 py-1 text-sm opacity-60">…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p, { status, q, sort, dir })}
            className={clsx(
              'rounded-lg px-2.5 py-1.5 text-sm border',
              'hover:bg-black/5 dark:hover:bg-white/10',
              p === page ? 'bg-black/5 dark:bg-white/10' : 'bg-transparent'
            )}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Link>
        )
      )}
    </nav>
  );
}
