// components/BackToInvoicesLink.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Back button that preserves the user's current invoice list state (status/q/page/sort/dir).
 * 1) Prefers current URL query params.
 * 2) Falls back to document.referrer if you landed here without params (e.g., older links/mobile).
 */
export default function BackToInvoicesLink({
  className,
  children = "Back to invoices",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const sp = useSearchParams();
  const [refHref, setRefHref] = useState<string | null>(null);

  const hrefFromParams = useMemo(() => {
    const qp = new URLSearchParams();
    const keys = ["status", "q", "page", "sort", "dir"] as const;
    keys.forEach((k) => {
      const v = sp.get(k);
      if (v) qp.set(k, v);
    });
    const qs = qp.toString();
    return `/invoices${qs ? `?${qs}` : ""}`;
  }, [sp]);

  useEffect(() => {
    // Fallback to referrer if there are NO known params on current URL
    const hasAny =
      sp.get("status") || sp.get("q") || sp.get("page") || sp.get("sort") || sp.get("dir");
    if (hasAny) return;

    try {
      const ref = document.referrer;
      if (!ref) return;
      const url = new URL(ref);
      // Only trust same-origin referrals and paths that start with /invoices
      if (url.pathname.startsWith("/invoices")) {
        const qs = url.search;
        setRefHref(`/invoices${qs ?? ""}`);
      }
    } catch {
      // ignore
    }
  }, [sp]);

  const finalHref = refHref ?? hrefFromParams;

  return (
    <Link
      href={finalHref}
      className={
        className ??
        "rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10 " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 " +
          "focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
      }
    >
      {children}
    </Link>
  );
}
