'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorCard({
  title,
  message,
  onRetry,
  homeHref = '/invoices',
  error,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
  error?: unknown;
}) {
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title ?? 'Something went wrong'}</h2>
        <p className="text-sm opacity-70">
          {message ?? 'This view failed to load. You can try again.'}
        </p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Try again
          </button>
        )}
        <Link
          href={homeHref}
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
