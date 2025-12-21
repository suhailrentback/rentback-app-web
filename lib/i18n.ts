import { cookies } from "next/headers";

export type Lang = "en" | "ur";

const dict = {
  en: {
    invoices_title: "My Invoices",
    table_number: "Number",
    table_created: "Created",
    table_due: "Due",
    table_status: "Status",
    table_total: "Total",
    table_actions: "Actions",

    no_invoices_title: "No invoices found",
    no_invoices_subtle: "Try a different filter or search query.",
    no_invoices_for_q: (q: string) =>
      `No results for “${q}”. Try a different number or clear the search.`,

    reset: "Reset",
    clear_search: "Clear search",
    view: "View",
    pdf: "PDF",
    prev: "Prev",
    next: "Next",
    open_invoice: (id: string) => `View invoice ${id}`,
    created_label: "Created",
    due_label: "Due",

    status_DRAFT: "DRAFT",
    status_ISSUED: "ISSUED",
    status_PAID: "PAID",
    status_OVERDUE: "OVERDUE",
  },
  ur: {
    invoices_title: "میری رسیدیں",
    table_number: "نمبر",
    table_created: "تاریخِ تخلیق",
    table_due: "ادائیگی کی آخری تاریخ",
    table_status: "حالت",
    table_total: "کل",
    table_actions: "اعمال",

    no_invoices_title: "کوئی رسید نہیں ملی",
    no_invoices_subtle: "کوئی دوسرا فلٹر یا تلاش آزمائیں۔",
    no_invoices_for_q: (q: string) =>
      `“${q}” کے لئے کوئی نتیجہ نہیں۔ کوئی دوسرا نمبر آزمائیں یا تلاش صاف کریں۔`,

    reset: "ری سیٹ",
    clear_search: "تلاش صاف کریں",
    view: "دیکھیں",
    pdf: "PDF",
    prev: "پچھلا",
    next: "اگلا",
    open_invoice: (id: string) => `انوائس دیکھیں ${id}`,
    created_label: "تخلیق",
    due_label: "آخری تاریخ",

    status_DRAFT: "مسودہ",
    status_ISSUED: "جاری",
    status_PAID: "اداشدہ",
    status_OVERDUE: "زائد المیعاد",
  },
} satisfies Record<Lang, any>;

export function t(lang: Lang, key: keyof typeof dict["en"], ...args: any[]): string {
  const val = (dict[lang] as any)[key];
  if (typeof val === "function") return val(...args);
  return val ?? (dict.en as any)[key] ?? key;
}

export function isRTL(lang: Lang) {
  return lang === "ur";
}

/** Server-only: read language from cookies. Fallback to 'en'. */
export function getLangServer(): Lang {
  try {
    const c = cookies();
    const v = c.get("rb_lang")?.value ?? c.get("lang")?.value ?? "en";
    return (v === "ur" ? "ur" : "en") as Lang;
  } catch {
    return "en";
  }
}
