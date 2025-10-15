// components/Footer.tsx
"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/index";

export default function Footer() {
  // We only read lang for a screen-reader hint; no server helpers here.
  const { lang } = useI18n();

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="inline-grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-white">
            RB
          </span>
          <span className="font-semibold">RentBack</span>
          <span className="sr-only">Language: {lang}</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link className="hover:text-emerald-700" href="/debug/status">
            Status
          </Link>
          <Link className="hover:text-emerald-700" href="/api/health">
            Health
          </Link>
        </nav>
      </div>
    </footer>
  );
}
