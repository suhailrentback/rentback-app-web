"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

type Props = {
  initial?: {
    q?: string;
    status?: string;
    from?: string; // YYYY-MM-DD
    to?: string;   // YYYY-MM-DD
  };
};

export default function InvoiceFilters({ initial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initial?.q ?? "");
  const [status, setStatus] = useState(initial?.status ?? "all");
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const next = new URLSearchParams(searchParams ?? undefined);
      // Write fields
      if (q) next.set("q", q); else next.delete("q");
      if (status && status !== "all") next.set("status", status);
      else next.delete("status");
      if (from) next.set("from", from); else next.delete("from");
      if (to) next.set("to", to); else next.delete("to");
      // reset pagination
      next.set("page", "1");
      router.push(`${pathname}?${next.toString()}`);
    },
    [q, status, from, to, pathname, router, searchParams]
  );

  const onClear = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "open", label: "Open" },
      { value: "paid", label: "Paid" },
      { value: "overdue", label: "Overdue" },
      { value: "void", label: "Void" },
      { value: "unpaid", label: "Unpaid" },
    ],
    []
  );

  return (
    <form onSubmit={onSubmit} className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
      <input
        type="search"
        placeholder="Search number or description…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border rounded px-3 py-2 md:col-span-2"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border rounded px-3 py-2"
      >
        {statusOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="border rounded px-3 py-2"
        aria-label="From date"
      />
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="border rounded px-3 py-2"
        aria-label="To date"
      />

      <div className="flex gap-2 md:col-span-5">
        <button type="submit" className="border rounded px-3 py-2">Apply</button>
        <button type="button" onClick={onClear} className="underline text-sm">Clear</button>
      </div>
    </form>
  );
}
