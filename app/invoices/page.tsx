// app/invoices/page.tsx
import Link from "next/link";

// Make this page always render on the server so filters & paging work via URL.
export const dynamic = "force-dynamic";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

type InvoiceRow = {
  id: string;
  number: string;
  title: string;
  issued_at: string; // ISO
  due_date: string;  // ISO
  total_cents: number;
  currency: string;  // e.g. "USD", "PKR", "EUR"
  status: InvoiceStatus;
  landlord_name?: string | null;
};

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function InvoicesPage({ searchParams }: PageProps) {
  // Read filters from URL
  const status = str(searchParams?.status); // "all" | DRAFT | ISSUED | PAID | OVERDUE
  const from = str(searchParams?.from);     // datetime-local (ISO-ish)
  const to = str(searchParams?.to);
  const page = clampInt(str(searchParams?.page) || "1", 1, 999_999);
  const perPage = clampInt(str(searchParams?.perPage) || "20", 10, 100);
  const offset = (page - 1) * perPage;

  // DEMO mode: show stub data if NEXT_PUBLIC_DEMO isn't explicitly "false"
  const demo =
    (process.env.NEXT_PUBLIC_DEMO ?? "true").toLowerCase() !== "false";

  let rows: InvoiceRow[] = [];
  let total = 0;

  if (demo) {
    const all = demoInvoices();
    const filtered = all.filter((r) => {
      if (status && status !== "all" && r.status !== status) return false;
      if (from && new Date(r.issued_at) < new Date(from)) return false;
      if (to && new Date(r.issued_at) > new Date(to)) return false;
      return true;
    });
    total = filtered.length;
    rows = filtered.slice(offset, offset + perPage);
  } else {
    // Non-demo placeholder: keep things green even if DB isn’t wired yet.
    total = 0;
    rows = [];
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <section className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Invoices</h1>
          <p className="text-sm opacity-70">
            View your rent invoices, filter by status/date, and open details.
          </p>
        </div>
        <Link
          href="/invoices"
          className="rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Reset Filters
        </Link>
      </header>

      {/* Filters */}
      <form className="grid gap-3 md:grid-cols-5 items-end">
        <div className="grid gap-1">
          <label className="text-xs opacity-70">Status</label>
          <select
            name="status"
            defaultValue={status || "all"}
            className="rounded-xl px-3 py-2 border bg-transparent"
          >
            <option value="all">All</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs opacity-70">From</label>
          <input
            type="datetime-local"
            name="from"
            defaultValue={from}
            className="rounded-xl px-3 py-2 border bg-transparent"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs opacity-70">To</label>
          <input
            type="datetime-local"
            name="to"
            defaultValue={to}
            className="rounded-xl px-3 py-2 border bg-transparent"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs opacity-70">Per Page</label>
          <select
            name="perPage"
            defaultValue={String(perPage)}
            className="rounded-xl px-3 py-2 border bg-transparent"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg:white/10"
          >
            Apply
          </button>
          <input type="hidden" name="page" value="1" />
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="text-left p-3 font-medium">Invoice #</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Issued</th>
              <th className="text-left p-3 font-medium">Due</th>
              <th className="text-left p-3 font-medium">Amount</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  No invoices.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-black/5 dark:border-white/10 align-middle"
                >
                  <td className="p-3 whitespace-nowrap font-medium">
                    {r.number}
                  </td>
                  <td className="p-3">{r.title}</td>
                  <td className="p-3 whitespace-nowrap">
                    {fmtDate(r.issued_at)}
                  </td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(r.due_date)}</td>
                  <td className="p-3 whitespace-nowrap">
                    {fmtMoney(r.total_cents, r.currency)}
                  </td>
                  <td className="p-3">{StatusBadge(r.status)}</td>
                  <td className="p-3">
                    <Link
                      href={`/invoices/${r.id}`}
                      className="rounded-lg px-3 py-1 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-70">
          Page {page} / {totalPages} · {total} row{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <PagerLink
            disabled={page <= 1}
            label="Prev"
            page={page - 1}
            status={status}
            from={from}
            to={to}
            perPage={perPage}
          />
          <PagerLink
            disabled={page >= totalPages}
            label="Next"
            page={page + 1}
            status={status}
            from={from}
            to={to}
            perPage={perPage}
          />
        </div>
      </div>
    </section>
  );
}

/** Helpers */

function PagerLink(props: {
  disabled: boolean;
  label: string;
  page: number;
  status: string;
  from: string;
  to: string;
  perPage: number;
}) {
  const { disabled, label, page, status, from, to, perPage } = props;
  if (disabled) {
    return (
      <span className="rounded-xl px-3 py-2 border text-sm opacity-50">
        {label}
      </span>
    );
  }
  const sp = new URLSearchParams();
  if (status && status !== "all") sp.set("status", status);
  if (from) sp.set("from", from);
  if (to) sp.set("to", to);
  sp.set("page", String(page));
  sp.set("perPage", String(perPage));
  return (
    <Link
      href={`/invoices?${sp.toString()}`}
      className="rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

function StatusBadge(s: InvoiceStatus) {
  const base = "inline-block text-xs px-2 py-1 rounded-full border";
  switch (s) {
    case "PAID":
      return <span className={`${base} border-emerald-400`}>Paid</span>;
    case "OVERDUE":
      return <span className={`${base} border-red-400`}>Overdue</span>;
    case "ISSUED":
      return <span className={`${base} border-amber-400`}>Issued</span>;
    case "DRAFT":
    default:
      return <span className={`${base} border-slate-400`}>Draft</span>;
  }
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function fmtMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function str(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

function clampInt(v: string, min: number, max: number) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function demoInvoices(): InvoiceRow[] {
  // Create some predictable demo rows across statuses & dates
  const now = Date.now();
  const days = (n: number) => new Date(now + n * 24 * 3600 * 1000).toISOString();

  const basic = (i: number, status: InvoiceStatus, deltaIssue: number, deltaDue: number): InvoiceRow => ({
    id: `inv_${i}`,
    number: `RB-${2025}-${String(i).padStart(4, "0")}`,
    title: `Monthly Rent #${i}`,
    issued_at: days(deltaIssue),
    due_date: days(deltaDue),
    total_cents: 85000 * 100, // 85,000 PKR example
    currency: "PKR",
    status,
    landlord_name: "ABC Properties",
  });

  const arr: InvoiceRow[] = [];
  // A mix
  arr.push(basic(1, "PAID", -60, -45));
  arr.push(basic(2, "PAID", -30, -15));
  arr.push(basic(3, "ISSUED", -5, +10));
  arr.push(basic(4, "OVERDUE", -40, -5));
  arr.push(basic(5, "DRAFT", +0, +15));
  // Fill a few more for paging
  for (let i = 6; i <= 26; i++) {
    const mod = i % 4;
    const status: InvoiceStatus =
      mod === 0 ? "PAID" : mod === 1 ? "ISSUED" : mod === 2 ? "OVERDUE" : "DRAFT";
    arr.push(basic(i, status, -i, 10 - (i % 20)));
  }
  return arr;
}
