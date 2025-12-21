'use client';

import Link from 'next/link';

export type SortKey = 'created_at' | 'due_at' | 'number' | 'total';
export type SortDir = 'asc' | 'desc';

export function SortHeader({
  label,
  field,
  activeSort,
  dir,
  status,
  q,
  page,
}: {
  label: string;
  field: SortKey;
  activeSort: SortKey;
  dir: SortDir;
  status?: string | null | undefined;
  q?: string | null | undefined;
  page?: number | undefined;
}) {
  const nextDir: SortDir =
    activeSort === field ? (dir === 'asc' ? 'desc' : 'asc') : 'desc';

  const params = new URLSearchParams();
  params.set('sort', field);
  params.set('dir', nextDir);
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  if (page) params.set('page', String(page));

  const href = '/invoices?' + params.toString();

  const arrow =
    activeSort !== field ? '↕' : dir === 'asc' ? '↑' : '↓';

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm hover:underline"
      aria-label={`Sort by ${label}`}
    >
      <span>{label}</span>
      <span aria-hidden>{arrow}</span>
    </Link>
  );
}
