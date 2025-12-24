import Link from "next/link";
import clsx from "clsx";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import StatusBadge from "@/components/StatusBadge";
import InvoiceListMobile from "@/components/InvoiceListMobile";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 10;

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null; // cents
  currency: string | null;
  created_at: string | null;
};

type StatusFilterKey = "all" | "unpaid" | "overdue" | "paid";
type SortKey = "created_at" | "due_at" | "number" | "total";
type SortDir = "asc" | "desc";

function getSb() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}

function pickQP(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const v = searchParams?.[key];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function normalizeFilter(val: string | null | undefined): StatusFilterKey {
  const allowed: StatusFilterKey[] = ["all", "unpaid", "overdue", "paid"];
  if (!val) return "all";
  return (allowed.includes(val as StatusFilterKey) ? val : "all") as StatusFilterKey;
}

function normalizeSort(val: string | null | undefined): SortKey {
  const allowed: SortKey[] = ["created_at", "due_at", "number", "total"];
  if (!val) return "created_at";
  return (allowed.includes(val as SortKey) ? val : "created_at") as SortKey;
}

function normalizeDir(val: string | null | undefined): SortDir {
  return val === "asc" || val === "desc" ? val : "desc";
}

function parsePage(raw?: string): number {
  const n = Number(raw ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function safeCurrency(input?: string): string | null {
  if (!input) return null;
  const c = input.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : null;
}

function parseDate(raw?: string) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function toCents(raw?: string): number | null {
  if (!raw) return null;
  const n = Number(raw.toString().replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** Lightly typed filter helper that keeps the builder chainable. */
function applyFilters<T extends { eq: any; in: any; ilike: any; gte?: any; lte?: any; }>({
  qb,
  userId,
  filter,
  q,
  currency,
  from,
  to,
  minCents,
  maxCents,
}: {
  qb: T;
  userId: string;
  filter: StatusFilterKey;
  q?: string;
  currency?: string | null;
  from?: Date | null;
  to?: Date | null;
  minCents?: number | null;
  maxCents?: number | null;
}): T {
  let query = (qb as any).eq("user_id", userId);

  switch (filter) {
    case "paid":
      query = query.eq("status", "PAID");
      break;
    case "overdue":
      query = query.eq("status", "OVERDUE");
      break;
    case "unpaid":
      query = query.in("status", ["ISSUED", "OVERDUE"]);
      break;
    case "all":
    default:
      break;
  }

  if (q && q.trim()) {
    // search by invoice number (partial)
    query = query.ilike("number", `%${q.trim()}%`);
  }

  if (currency) {
    query = query.eq("currency", currency);
  }

  if (from) {
    query = query.gte?.("due_at", from.toISOString()) ?? query;
  }
  if (to) {
    // add one day to include the 'to' date end
    const end = new Date(to);
    end.setDate(end.getDate() + 1);
    query = query.lte?.("due_at", end.toISOString()) ?? query;
  }

  if (minCents != null) {
    query = query.gte?.("total", minCents) ?? query;
  }
  if (maxCents != null) {
    query = query.lte?.("total", maxCents) ?? query;
  }

  return query as T;
}

function mkUrl(base: string, existing: Record<string, string | undefined>, next: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  const merged = { ...existing, ...next };
  for (const [k, v] of Object.entries(merged)) {
    if (v != null && v !== "") usp.set(k, v);
  }
  return `${base}?${usp.toString()}`;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filter = normalizeFilter(pickQP(searchParams, "status"));
  const q = pickQP(searchParams, "q");
  const sort = normalizeSort(pickQP(searchParams, "sort"));
  const dir = normalizeDir(pickQP(searchParams, "dir"));
  const page = parsePage(pickQP(searchParams, "page"));

  const cur = safeCurrency(pickQP(searchParams, "currency"));
  const from = parseDate(pickQP(searchParams, "from"));
  const to = parseDate(pickQP(searchParams, "to"));
  const minCents = toCents(pickQP(searchParams, "min"));
  const maxCents = toCents(pickQP(searchParams, "max"));

  const existingParams: Record<string, string | undefined> = {
    ...(filter !== "all" ? { status: filter } : {}),
    ...(q ? { q } : {}),
    ...(cur ? { currency: cur } : {}),
    ...(from ? { from: from.toISOString().slice(0, 10) } : {}),
    ...(to ? { to: to.toISOString().slice(0, 10) } : {}),
    ...(minCents != null ? { min: (minCents / 100).toFixed(2) } : {}),
    ...(maxCents != null ? { max: (maxCents / 100).toFixed(2) } : {}),
    sort,
    dir,
  };

  const supabase = getSb();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;

  if (!userId) {
    return (
      <section className="p-6">
        <div className="text-sm opacity-70">Please sign in to view your invoices.</div>
      </section>
    );
  }

  // total count
  let countQ = applyFilters({
    qb: supabase.from("invoices").select("*", { count: "exact", head: true }),
    userId,
    filter,
    q: q as string | undefined,
    currency: cur,
    from,
    to,
    minCents,
    maxCents,
  });
  const { count } = await countQ;
  const total = typeof count === "number" ? count : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // clamp page
  const safePage = Math.min(Math.max(1, page), totalPages);
  const fromIdx = (safePage - 1) * PAGE_SIZE;
  const toIdx = fromIdx + PAGE_SIZE - 1;

  // page rows with sort
  let dataQ = applyFilters({
    qb: supabase
      .from("invoices")
      .select("id, number, status, due_at, total, currency, created_at"),
    userId,
    filter,
    q: q as string | undefined,
    currency: cur,
    from,
    to,
    minCents,
    maxCents,
  })
    .order(sort, { ascending: dir === "asc" })
    .range(fromIdx, toIdx);

  const { data: rows, error } = await dataQ;
  const list: Invoice[] = error || !rows ? [] : (rows as Invoice[]);

  const ariaFor = (field: SortKey): "ascending" | "descending" | "none" =>
    sort === field ? (dir === "asc" ? "ascending" : "descending") : "none";

  const sortHref = (field: SortKey) => {
    const nextDir: SortDir = sort === field ? (dir === "asc" ? "desc" : "asc") : "asc";
    return mkUrl(
      "/invoices",
      existingParams,
      { sort: field, dir: nextDir, page: "1" }
    );
  };

  const statusLink = (key: StatusFilterKey) =>
    mkUrl(
      "/invoices",
      existingParams,
      { status: key === "all" ? undefined : key, page: "1" }
    );

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My Invoices</h1>
        <Link
          href="/landlord/invoices/new"
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          New Invoice
        </Link>
      </div>

      {/* Toolbar: status pills + search + advanced filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "All"],
              ["unpaid", "Unpaid"],
              ["overdue", "Overdue"],
              ["paid", "Paid"],
            ] as [StatusFilterKey, string][]
          ).map(([key, label]) => {
            const active = filter === key;
            return (
              <Link
                key={key}
                href={statusLink(key)}
                className={clsx(
                  "rounded-xl px-3 py-1.5 border text-xs",
                  active
                    ? "bg-black/5 dark:bg-white/10"
                    : "hover:bg-black/5 dark:hover:bg-white/10"
                )}
                aria-pressed={active}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <form method="get" className="flex flex-wrap items-end gap-3">
          {/* Keep existing filters via hidden fields */}
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {dir && <input type="hidden" name="dir" value={dir} />}
          {cur && <input type="hidden" name="currency" value={cur} />}
          {from && <input type="hidden" name="from" value={from.toISOString().slice(0, 10)} />}
          {to && <input type="hidden" name="to" value={to.toISOString().slice(0, 10)} />}
          {minCents != null && (
            <input type="hidden" name="min" value={(minCents / 100).toFixed(2)} />
          )}
          {maxCents != null && (
            <input type="hidden" name="max" value={(maxCents / 100).toFixed(2)} />
          )}

          <label className="block">
            <span className="text-xs opacity-70">Search (number)</span>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="e.g., INV-20251224-12345"
              className="mt-1 w-[260px] rounded-xl border px-3 py-2 bg-transparent"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Apply
          </button>

          <Link
            href="/invoices"
            className="rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Reset
          </Link>
        </form>

        {/* Advanced filters */}
        <form method="get" className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Preserve q/status/sort/dir across advanced changes */}
          {q && <input type="hidden" name="q" value={q} />}
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {dir && <input type="hidden" name="dir" value={dir} />}

          <label className="block">
            <span className="text-xs opacity-70">Currency</span>
            <input
              type="text"
              name="currency"
              defaultValue={cur ?? ""}
              placeholder="USD, EUR, PKR"
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent uppercase"
            />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Due from</span>
            <input
              type="date"
              name="from"
              defaultValue={from ? from.toISOString().slice(0, 10) : ""}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
            />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Due to</span>
            <input
              type="date"
              name="to"
              defaultValue={to ? to.toISOString().slice(0, 10) : ""}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
            />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Min total (major)</span>
            <input
              type="number"
              step="0.01"
              name="min"
              defaultValue={minCents != null ? (minCents / 100).toFixed(2) : ""}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
            />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Max total (major)</span>
            <input
              type="number"
              step="0.01"
              name="max"
              defaultValue={maxCents != null ? (maxCents / 100).toFixed(2) : ""}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Mobile list */}
      <div className="md:hidden">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-black/10 dark:border:white/10 p-6">
            <div className="font-medium">No invoices found</div>
            <div className="text-xs opacity-70 mt-1">
              Try different filters or clear the search.
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/invoices"
                className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg:white/10"
              >
                Reset
              </Link>
            </div>
          </div>
        ) : (
          <InvoiceListMobile rows={list} />
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead
            className={clsx(
              "sticky top-0 z-10 backdrop-blur",
              "bg-white/80 dark:bg-black/40",
              "border-b border-black/10 dark:border-white/10"
            )}
          >
            <tr>
              <th className="text-left p-3 font-medium w-36" aria-sort={ariaFor("number")}>
                <Link href={sortHref("number")} className="underline-offset-2 hover:underline">
                  Number
                </Link>
              </th>
              <th className="text-left p-3 font-medium w-40" aria-sort={ariaFor("created_at")}>
                <Link href={sortHref("created_at")} className="underline-offset-2 hover:underline">
                  Created
                </Link>
              </th>
              <th className="text-left p-3 font-medium w-40" aria-sort={ariaFor("due_at")}>
                <Link href={sortHref("due_at")} className="underline-offset-2 hover:underline">
                  Due
                </Link>
              </th>
              <th className="text-left p-3 font-medium w-32">Status</th>
              <th className="text-right p-3 font-medium w-36" aria-sort={ariaFor("total")}>
                <Link href={sortHref("total")} className="underline-offset-2 hover:underline">
                  Total
                </Link>
              </th>
              <th className="text-right p-3 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td className="p-6" colSpan={6}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">No invoices found</div>
                      <div className="text-xs opacity-70">
                        Try different filters or clear the search.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/invoices"
                        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        Reset
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              list.map((inv) => (
                <tr
                  key={inv.id}
                  className={clsx(
                    "border-t border-black/5 dark:border-white/10 transition-colors",
                    "hover:bg-black/5 dark:hover:bg-white/10",
                    inv.status === "OVERDUE" && "bg-red-500/[0.05]"
                  )}
                >
                  <td className="p-3 font-medium">
                    <Link href={`/invoices/${inv.id}`} className="hover:underline underline-offset-2">
                      {inv.number ?? "—"}
                    </Link>
                  </td>
                  <td className="p-3">
                    {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3">
                    {inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={inv.status} dueAt={inv.due_at} />
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {typeof inv.total === "number"
                      ? `${(inv.currency ?? "USD").toUpperCase()} ${(
                          inv.total / 100
                        ).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        View
                      </Link>
                      <a
                        href={`/api/receipts/${inv.id}`}
                        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        status={filter}
        q={q as string | undefined}
        extra={{
          currency: cur ?? undefined,
          from: from ? from.toISOString().slice(0, 10) : undefined,
          to: to ? to.toISOString().slice(0, 10) : undefined,
          min: minCents != null ? (minCents / 100).toFixed(2) : undefined,
          max: maxCents != null ? (maxCents / 100).toFixed(2) : undefined,
          sort,
          dir,
        }}
        basePath="/invoices"
      />
    </section>
  );
}
