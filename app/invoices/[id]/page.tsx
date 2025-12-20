// app/invoices/[id]/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import StatusBadge from "@/components/StatusBadge";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
type SortKey = "created_at" | "due_at" | "number" | "total";
type SortDir = "asc" | "desc";
type StatusFilterKey = "all" | "unpaid" | "overdue" | "paid";

type Invoice = {
  id: string;
  number: string | null;
  status: InvoiceStatus;
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const filter = normalizeFilter(pickQP(searchParams, "status"));
  const q = pickQP(searchParams, "q");
  const sort = normalizeSort(pickQP(searchParams, "sort"));
  const dir = normalizeDir(pickQP(searchParams, "dir"));

  const { supabase, userId } = await getUserSupabase();
  if (!supabase || !userId) {
    return (
      <section className="p-6 space-y-4">
        <BackToListLink searchParams={searchParams} />
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
          <div className="font-medium">Not signed in</div>
          <div className="text-sm opacity-70 mt-1">
            Please sign in to view this invoice.
          </div>
        </div>
      </section>
    );
  }

  // 1) Load the current invoice
  const { data: inv, error } = await supabase
    .from("invoices")
    .select("id, number, status, due_at, total, currency, created_at")
    .eq("user_id", userId)
    .eq("id", params.id)
    .maybeSingle<Invoice>();

  if (error || !inv) {
    return (
      <section className="p-6 space-y-4">
        <BackToListLink searchParams={searchParams} />
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
          <div className="font-medium">Invoice not found</div>
          <div className="text-sm opacity-70 mt-1">
            The invoice you’re looking for does not exist or you don’t have
            access.
          </div>
        </div>
      </section>
    );
  }

  // 2) Compute overdue banner
  const dueDate =
    typeof inv.due_at === "string" && inv.due_at ? new Date(inv.due_at) : null;
  const isOverdue =
    !!dueDate &&
    isFinite(dueDate.getTime()) &&
    inv.status !== "PAID" &&
    endOfDay(dueDate).getTime() < Date.now();

  // 3) Find prev/next IDs under the SAME filters & order (first 100 rows window)
  const { prevId, nextId } = await fetchNeighborIds(
    supabase,
    userId,
    filter,
    q,
    sort,
    dir,
    inv.id
  );

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <BackToListLink searchParams={searchParams} />

        <div className="flex items-center gap-2">
          {prevId ? (
            <Link
              href={withParams(`/invoices/${prevId}`, searchParams)}
              className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              ← Previous
            </Link>
          ) : null}
          {nextId ? (
            <Link
              href={withParams(`/invoices/${nextId}`, searchParams)}
              className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              Next →
            </Link>
          ) : null}
        </div>
      </div>

      {isOverdue ? (
        <div
          className="rounded-2xl border border-rose-200/70 bg-rose-50 text-rose-900
                     dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="text-sm">
            <span className="font-medium">Overdue.</span>{" "}
            This invoice was due on <strong>{formatDate(dueDate!)}</strong>.
          </div>
        </div>
      ) : null}

      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Invoice {inv.number ? `#${inv.number}` : inv.id}
          </h1>
          <div className="text-sm opacity-70 mt-1">
            Created{" "}
            {inv.created_at
              ? formatDate(new Date(inv.created_at))
              : "—"}
          </div>
        </div>
        <StatusBadge status={inv.status} dueAt={inv.due_at} />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetaCard label="Due date" value={dueDate ? formatDate(dueDate) : "—"} />
        <MetaCard
          label="Total"
          value={
            typeof inv.total === "number"
              ? `${(inv.currency ?? "USD").toUpperCase()} ${(
                  inv.total / 100
                ).toFixed(2)}`
              : "—"
          }
        />
        <MetaCard label="Currency" value={(inv.currency ?? "USD").toUpperCase()} />
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`/api/receipts/${inv.id}`}
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          Download PDF
        </a>
        <Link
          href={withParams("/invoices", searchParams)}
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          Back to list
        </Link>
      </div>
    </section>
  );
}

/* ---------- UI bits ---------- */

function BackToListLink({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return (
    <Link
      href={withParams("/invoices", searchParams)}
      className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
    >
      ← Back to Invoices
    </Link>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}

/* ---------- Helpers (keep in-file to avoid shared type deps) ---------- */

function withParams(
  base: string,
  searchParams?: Record<string, string | string[] | undefined>
) {
  const status = normalizeFilter(pickQP(searchParams, "status"));
  const q = pickQP(searchParams, "q");
  const sort = normalizeSort(pickQP(searchParams, "sort"));
  const dir = normalizeDir(pickQP(searchParams, "dir"));

  const s = new URLSearchParams();
  if (status !== "all") s.set("status", status);
  if (q) s.set("q", q);
  if (sort) s.set("sort", sort);
  if (dir) s.set("dir", dir);
  const qs = s.toString();
  return qs ? `${base}?${qs}` : base;
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

function pickQP(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const v = searchParams?.[key];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

async function getUserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { supabase: null as any, userId: null as string | null };

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

async function fetchNeighborIds(
  supabase: any,
  userId: string,
  filter: StatusFilterKey,
  q: string | undefined,
  sort: SortKey,
  dir: SortDir,
  currentId: string
): Promise<{ prevId: string | null; nextId: string | null }> {
  // We reuse the same filtering logic as the list, fetch a small ordered window,
  // and compute neighbors around the current ID.
  const PAGE_WINDOW = 100;

  let qb = supabase
    .from("invoices")
    .select(`id, ${sort}`)
    .eq("user_id", userId);

  // Apply filters (lightweight, avoids depending on PostgrestFilterBuilder type)
  qb = applyFilters(qb as any, filter, q);

  qb = qb.order(sort, { ascending: dir === "asc" }).order("id", { ascending: true });

  const { data, error } = await qb.range(0, PAGE_WINDOW - 1);
  if (error || !data) return { prevId: null, nextId: null };

  const idx = (data as { id: string }[]).findIndex((r) => r.id === currentId);
  if (idx === -1) return { prevId: null, nextId: null };

  const prevId = idx > 0 ? data[idx - 1].id : null;
  const nextId = idx < data.length - 1 ? data[idx + 1].id : null;
  return { prevId, nextId };
}

function applyFilters(
  qb: { eq: any; in: any; ilike: any },
  filter: StatusFilterKey,
  q?: string
) {
  let query = qb.eq("user_id", qb["user_id"] ?? undefined); // no-op for typing, keep chainable
  // replace with real user_id filter in the caller before; we keep pattern consistent
  query = qb;

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

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function endOfDay(d: Date) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}
