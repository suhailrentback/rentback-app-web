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

export default function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // read initial values from URL
  const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<string>(searchParams.get("status") ?? "all");

  // keep URL in sync (shareable state, back/forward works)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    q ? params.set("q", q) : params.delete("q");
    status && status !== "all" ? params.set("status", status) : params.delete("status");
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  // dynamic status options from data (no schema assumptions)
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const inv of invoices) {
      const s = (inv.status ?? "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [invoices]);

  // filtered rows
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesStatus = status === "all" || (inv.status ?? "").toLowerCase() === status.toLowerCase();
      const hay = `${inv.number ?? ""} ${inv.description ?? ""}`.toLowerCase();
      const matchesQ = !qLower || hay.includes(qLower);
      return matchesStatus && matchesQ;
    });
  }, [invoices, q, status]);

  return (
    <section className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
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
      </div>

      {/* List/Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-gray-600">
          No invoices match your filters.
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
              {filtered.map((inv) => {
                const amount =
                  typeof inv.total_amount === "number"
                    ? inv.total_amount
                    : null;
                const currency = inv.currency ?? "PKR";
                const due = inv.due_date ? new Date(inv.due_date).toDateString() : "—";
                return (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-3 whitespace-nowrap">{inv.number ?? "—"}</td>
                    <td className="px-4 py-3">{inv.description ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{inv.status ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{due}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {amount !== null ? `${amount} ${currency}` : "—"}
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
    </section>
  );
}
