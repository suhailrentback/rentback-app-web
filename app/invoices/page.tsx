// app/invoices/page.tsx
import Link from "next/link";
import clsx from "clsx";
import StatusBadge, { overdueRowClass } from "@/components/StatusBadge";
import StatusFilters, { type StatusFilterKey } from "@/components/StatusFilters";
import InvoiceSearch from "@/components/InvoiceSearch";
import Pagination from "@/components/Pagination";
import SortControls, { type SortKey, type SortDir } from "@/components/SortControls";
import SortHeader from "@/components/SortHeader";
import InvoiceListMobile from "@/components/InvoiceListMobile";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const PAGE_SIZE = 10;

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

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

function pickQP(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const v = searchParams?.[key];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function parsePage(raw?: string): number {
  const n = Number(raw ?? "1");
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

async function getUserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { supabase: null, userId: null as string | null };

  const cookieStore = cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });

  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;
  return { supabase, userId };
}

function applyFilters<T extends import("@supabase/supabase-js").PostgrestFilterBuilder<any, any, any>>(
  qb: T,
  userId: string,
  filter: StatusFilterKey,
  q?: string
) {
  let query = qb.eq("user_id", userId);

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
    query = query.ilike("number", `%${q.trim()}%`);
  }
  return query;
}

async function fetchInvoices(
  filter: StatusFilterKey,
  q: string | undefined,
  page: number,
  sort: SortKey,
  dir: SortDir
): Promise<{ rows: Invoice[]; totalPages: number }> {
  const { supabase, userId } = await getUserSupabase();
  if (!supabase || !userId) return { rows: [], totalPages: 1 };

  // total count
  let countQ = applyFilters(
    supabase.from("invoices").select("*", { count: "exact", head: true }),
    userId,
    filter,
    q
  );
  const { count } = await countQ;
  const total = typeof count === "number" ? count : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // clamp page
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // page rows with sort
  let dataQ = applyFilters(
    supabase
      .from("invoices")
      .select("id, number, status, due_at, total, currency, created_at"),
    userId,
    filter,
    q
  )
    .order(sort, { ascending: dir === "asc" })
    .range(from, to);

  const { data, error } = await dataQ;
  if (error || !data) return { rows: [], totalPages };
  return { rows: data as Invoice[], totalPages };
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filter = normalizeFilter(pickQP(searchParams, "status"));
  const q = pickQP(searchParams, "q");
  const page = parsePage(pickQP(searchParams, "page"));
  const sort = normalizeSort(pickQP(searchParams, "sort"));
  const dir = normalizeDir(pickQP(searchParams, "dir"));

  const { rows, totalPages } = await fetchInvoices(filter, q, page, sort, dir);

  const ariaFor = (field: SortKey): "ascending" | "descending" | "none" =>
    sort === field ? (dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My Invoices</h1>
        <div className="flex items-center gap-3">
          <StatusFilters />
          <InvoiceSearch q={q} status={filter === "all" ? undefined : filter} />
          <SortControls
            sort={sort}
            dir={dir}
            status={filter === "all" ? undefined : filter}
            q={q}
            page={page}
          />
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
            <div className="font-medium">No invoices found</div>
            <div className="text-xs opacity-70 mt-1">
              {q
                ? `No results for “${q}”. Try a different number or clear the search.`
                : "Try a different filter or check back later."}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/invoices"
                className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                           focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
              >
                Reset
              </Link>
              {filter !== "all" ? (
                <Link
                  href={`/invoices?status=${filter}`}
                  className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                             focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
                >
                  Clear search
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <InvoiceListMobile rows={rows} />
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
                <SortHeader
                  label="Number"
                  field="number"
                  activeSort={sort}
                  dir={dir}
                  status={filter === "all" ? undefined : filter}
                  q={q}
                  page={page}
                />
              </th>
              <th className="text-left p-3 font-medium w-40" aria-sort={ariaFor("created_at")}>
                <SortHeader
                  label="Created"
                  field="created_at"
                  activeSort={sort}
                  dir={dir}
                  status={filter === "all" ? undefined : filter}
                  q={q}
                  page={page}
                />
              </th>
              <th className="text-left p-3 font-medium w-40" aria-sort={ariaFor("due_at")}>
                <SortHeader
                  label="Due"
                  field="due_at"
                  activeSort={sort}
                  dir={dir}
                  status={filter === "all" ? undefined : filter}
                  q={q}
                  page={page}
                />
              </th>
              <th className="text-left p-3 font-medium w-32">Status</th>
              <th className="text-right p-3 font-medium w-36" aria-sort={ariaFor("total")}>
                <SortHeader
                  label="Total"
                  field="total"
                  activeSort={sort}
                  dir={dir}
                  status={filter === "all" ? undefined : filter}
                  q={q}
                  page={page}
                />
              </th>
              <th className="text-right p-3 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-6" colSpan={6}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">No invoices found</div>
                      <div className="text-xs opacity-70">
                        {q
                          ? `No results for “${q}”. Try a different number or clear the search.`
                          : "Try a different filter or check back later."}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/invoices"
                        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
                      >
                        Reset
                      </Link>
                      {filter !== "all" ? (
                        <Link
                          href={`/invoices?status=${filter}`}
                          className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
                        >
                          Clear search
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((inv) => (
                <tr
                  key={inv.id}
                  className={clsx(
                    "border-t border-black/5 dark:border-white/10 transition-colors",
                    "hover:bg-black/5 dark:hover:bg-white/10",
                    overdueRowClass(inv.status, inv.due_at)
                  )}
                >
                  <td className="p-3 font-medium">{inv.number ?? "—"}</td>
                  <td className="p-3">
                    {inv.created_at
                      ? new Date(inv.created_at).toLocaleDateString()
                      : "—"}
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
                        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg:white/10
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
                      >
                        View
                      </Link>
                      <a
                        href={`/api/receipts/${inv.id}`}
                        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
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
        page={page}
        totalPages={totalPages}
        status={filter === "all" ? undefined : filter}
        q={q}
      />
    </section>
  );
}
