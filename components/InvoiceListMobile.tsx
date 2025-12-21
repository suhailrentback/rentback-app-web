import Link from "next/link";
import clsx from "clsx";
import StatusBadge from "@/components/StatusBadge";
import { t, type Lang } from "@/lib/i18n";

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

export default function InvoiceListMobile({
  rows,
  lang = "en",
}: {
  rows: Invoice[];
  lang?: Lang;
}) {
  if (!rows || rows.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-black/10 dark:border-white/10 p-6"
      >
        <div className="font-medium">{t(lang, "no_invoices_title")}</div>
        <div className="text-xs opacity-70 mt-1">
          {t(lang, "no_invoices_subtle")}
        </div>
      </div>
    );
  }

  return (
    <ul role="list" className="space-y-3">
      {rows.map((inv) => {
        const created = inv.created_at
          ? new Date(inv.created_at).toLocaleDateString()
          : "—";
        const due = inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—";
        const total =
          typeof inv.total === "number"
            ? `${(inv.currency ?? "USD").toUpperCase()} ${(inv.total / 100).toFixed(2)}`
            : "—";

        return (
          <li
            key={inv.id}
            role="listitem"
            className={clsx(
              "relative rounded-2xl border border-black/10 dark:border-white/10 p-4",
              "focus-within:ring-2 focus-within:ring-emerald-500"
            )}
          >
            <Link
              href={`/invoices/${inv.id}`}
              className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
              aria-label={t(lang, "open_invoice", inv.number ?? inv.id)}
            >
              <span className="sr-only">{t(lang, "view")}</span>
            </Link>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {inv.number ?? "—"}
                </div>
                <div className="text-xs opacity-70 mt-0.5">
                  {t(lang, "created_label")}: {created} • {t(lang, "due_label")}: {due}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm tabular-nums">{total}</div>
                <div className="mt-1 flex justify-end">
                  <StatusBadge status={inv.status} dueAt={inv.due_at} lang={lang} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
