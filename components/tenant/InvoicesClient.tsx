"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  issued_at: string | null;
  due_date: string | null;
  total_amount: number | null;
  currency: string | null;
  description?: string | null;
};

type SortKey =
  | "newest"
  | "oldest"
  | "dueSoon"
  | "amountDesc"
  | "amountAsc"
  | "status";

const DEFAULT_SORT: SortKey = "newest";
const DEFAULT_PAGE_SIZE = 10;

export default function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // read initial values from URL
  const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<string>(searchParams.get("status") ?? "all");
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get("sort") as SortKey) ?? DEFAULT_SORT
  );
  const [pageSize, setPageSize] = useState<number>(
    Number(searchParams.get("size")) || DEFAULT_PAGE_SIZE
  );
  const [page, setPage] = useState<number>(Math.max(1, Number(searchParams.get("page")) || 1));

  // keep URL in sync (shareable state, back/forward works)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    q ? params.set("q", q) : params.delete("q");
    status && status !== "all" ? params.set("status", status) : params.delete("status");
    sort !== DEFAULT_SORT ? params.set("sort", sort) : params.delete("sort");
    pageSize !== DEFAULT_PAGE_SIZE ? params.set("size", String(pageSize)) : params.delete("size");
    page > 1 ? params.set("page", String(page)) : params.delete("page");
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, sort, pageSize, page]);

  // when filters change, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [q, status, sort, pageSize]);

  // dynamic status options from data (no schema assumptions)
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const inv of invoices) {
      const s = (inv.status ?? "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invoices]);

  // filter
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesStatus = status === "all" || (inv.status ?? "").toLowerCase() === status.toLowerCase();
      const hay = `${inv.number ?? ""} ${inv.description ?? ""}`.toLowerCase();
      const matchesQ = !qLower || hay.includes(qLower);
      return matchesStatus && matchesQ;
    });
  }, [invoices, q, status]);

  // sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const num = (n: unknown) => (typeof n === "number" ? n : Number.NEGATIVE_INFINITY);
    const dateVal = (d: string | null) => (d ? new Date(d).getTime() : Number.NEGATIVE_INFINITY);

    arr.sort((a, b) => {
      switch (sort) {
        case "newest":
          return dateVal(b.issued_at) - dateVal(a.issued_at);
        case "oldest":
          return dateVal(a.issued_at) - dateVal(b.issued_at);
        case "dueSoon": {
          const av = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
          const bv = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
          return av - bv;
        }
        case "amountDesc":
          return num(b.total_amount) - num(a.total_amount);
        case "amountAsc":
          return num(a.total_amount) - num(b.total_amount);
        case "status":
          return (a.status ?? "").localeCompare(b.status ?? "");
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sort]);

  // pagination
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const current = sorted.slice(start, end);

  const fmtMoney = (amount: number | null, currency: string | null) => {
    if (typeof amount !== "number") return "—";
    const cur = currency || "PKR";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(amount);
    } catch {
      return `${amount} ${cur}`;
    }
  };

  const clearFilters = () => {
    setQ("");
    setStatus("all");
    setSort(DEFAULT_SORT);
    setPageSize(DEFAULT_PAGE_SIZE);
    setPage(1);
  };

  return (
    <section className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="block text-xs font-medium text-gray-600">
            Search
          </label>
          <input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search invoice # or description…"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-xs font-medium text-gray-600">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s.toLowerCase()}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="block text-xs font-medium text-gray-600">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="mt-1 rounded-md border px-3 py-2 text-sm"
          >
            <option value="newest">Newest (issued)</option>
            <option value="oldest">Oldest (issued)</option>
            <option value="dueSoon">Due soon</option>
            <option value="amountDesc">Amount: high → low</option>
            <option value="amountAsc">Amount: low → high</option>
            <option value="status">Status (A–Z)</option>
          </select>
        </div>

        <div>
          <label htmlFor="size" className="block text-xs font-medium text-gray-600">
            Page size
          </label>
          <select
            id="size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="mt-1 rounded-md border px-3 py-2 text-sm"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="mt-5 lg:mt-0 rounded-md border px-3 py-2 text-sm"
          title="Reset all filters"
        >
          Clear
        </button>
      </div>

      {/* List/Table */}
      {current.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-gray-600">
          {total === 0 ? "No invoices match your filters." : "No invoices on this page."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {current.map((inv) => {
                const due = inv.due_date ? new Date(inv.due_date).toDateString() : "—";
                return (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-3 whitespace-nowrap">{inv.number ?? "—"}</td>
                    <td className="px-4 py-3">{inv.description ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{inv.status ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{due}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fmtMoney(inv.total_amount, inv.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tenant/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pager */}
      <div className="flex items-center justify-between text-sm">
        <div>
          Showing{" "}
          <strong>
            {total === 0 ? 0 : start + 1}-{Math.min(end, total)}
          </strong>{" "}
          of <strong>{total}</strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border px-3 py-1 disabled:opacity-50"
            aria-disabled={safePage <= 1}
          >
            ← Prev
          </button>
          <span>
            Page <strong>{safePage}</strong> / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border px-3 py-1 disabled:opacity-50"
            aria-disabled={safePage >= totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
