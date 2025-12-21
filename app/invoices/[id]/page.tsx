import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getLangServer, isRTL, t, type Lang } from "@/lib/i18n";

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

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

export default async function InvoiceDetails({
  params,
}: {
  params: { id: string };
}) {
  const lang: Lang = getLangServer();
  const rtl = isRTL(lang);

  const { supabase, userId } = await getUserSupabase();
  if (!supabase || !userId) {
    return (
      <section className="p-6" dir={rtl ? "rtl" : "ltr"}>
        <div className="text-sm opacity-70">Not authenticated</div>
      </section>
    );
  }

  const { data: inv, error } = await supabase
    .from("invoices")
    .select("id, number, status, due_at, total, currency, created_at")
    .eq("user_id", userId)
    .eq("id", params.id)
    .maybeSingle<Invoice>();

  if (error || !inv) {
    return (
      <section className="p-6" dir={rtl ? "rtl" : "ltr"}>
        <div className="text-sm opacity-70">{t(lang, "no_invoices_title")}</div>
        <div className="mt-4">
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t(lang, "invoices_title")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 space-y-4" dir={rtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {t(lang, "table_number")}: {inv.number ?? inv.id}
        </h1>
        <div className="flex items-center gap-2">
          <a
            href={`/api/receipts/${inv.id}`}
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t(lang, "pdf")}
          </a>
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t(lang, "invoices_title")}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="opacity-60">{t(lang, "table_status")}</div>
            <div className="font-medium">{t(lang, `status_${inv.status}` as any)}</div>
          </div>
          <div>
            <div className="opacity-60">{t(lang, "table_created")}</div>
            <div className="font-medium">
              {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
            </div>
          </div>
          <div>
            <div className="opacity-60">{t(lang, "table_due")}</div>
            <div className="font-medium">
              {inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}
            </div>
          </div>
          <div>
            <div className="opacity-60">{t(lang, "table_total")}</div>
            <div className="font-medium">
              {typeof inv.total === "number"
                ? `${(inv.currency ?? "USD").toUpperCase()} ${(inv.total / 100).toFixed(2)}`
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
