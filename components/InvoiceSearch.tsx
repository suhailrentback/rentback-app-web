// components/InvoiceSearch.tsx
// Server component: simple GET form that preserves the current status filter.
export default function InvoiceSearch(props: { q?: string; status?: string }) {
  const { q, status } = props;
  return (
    <form
      method="get"
      action="/invoices"
      className="flex items-center gap-2"
      role="search"
      aria-label="Search invoices"
    >
      {status ? <input type="hidden" name="status" value={status} /> : null}
      <input
        type="text"
        name="q"
        defaultValue={q ?? ""}
        placeholder="Search invoice #"
        className="rounded-xl border px-3 py-1.5 text-sm border-black/10 dark:border-white/10 bg-transparent"
      />
      <button
        type="submit"
        className="rounded-xl px-3 py-1.5 text-sm border hover:bg-black/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10"
      >
        Search
      </button>
    </form>
  );
}
