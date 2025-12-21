type Props = {
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  dueAt: string | null;
  lang?: "en" | "ur";
};

import { t } from "@/lib/i18n";

export default function StatusBadge({ status, dueAt, lang = "en" }: Props) {
  const isOverdue =
    status !== "PAID" &&
    !!dueAt &&
    new Date(dueAt).getTime() < Date.now();

  const base =
    status === "PAID"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : status === "ISSUED"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
      : status === "DRAFT"
      ? "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200"
      : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200";

  const label =
    isOverdue && status !== "PAID"
      ? t(lang, "status_OVERDUE")
      : t(lang, (`status_${status}` as any));

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${base}`}>
      {label}
    </span>
  );
}
