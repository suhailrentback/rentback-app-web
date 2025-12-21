'use client';

import { useSearchParams } from 'next/navigation';

export default function InvoiceSearch({
  q,
  status,
}: {
  q?: string | null | undefined;
  status?: string | null | undefined;
}) {
  const sp = useSearchParams();
  const sort = sp.get('sort') ?? undefined;
  const dir = sp.get('dir') ?? undefined;
  const page = sp.get('page') ?? undefined;

  return (
    <form method="get" className="flex items-center gap-2">
      <input type="hidden" name="status" value={status ?? ''} />
      {sort ? <input type="hidden" name="sort" value={sort} /> : null}
      {dir ? <input type="hidden" name="dir" value={dir} /> : null}
      {page ? <input type="hidden" name="page" value={page} /> : null}

      <input
        name="q"
        defaultValue={q ?? ''}
        placeholder="Search number..."
        className="rounded-xl border px-3 py-1.5 text-sm bg-transparent
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
      />
      <button
        type="submit"
        className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
      >
        Search
      </button>
    </form>
  );
}
