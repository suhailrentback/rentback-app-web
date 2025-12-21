'use client';
import ErrorCard from '@/components/ErrorCard';

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="p-6">
      <ErrorCard
        title="Invoices failed to load"
        message="We couldn't fetch your invoices. This may be a temporary network issue."
        onRetry={reset}
        homeHref="/invoices"
        error={error}
      />
    </section>
  );
}
