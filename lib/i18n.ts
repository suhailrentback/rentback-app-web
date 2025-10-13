// ✅ COPY–PASTE THIS FILE INTO *BOTH* PROJECTS:
// WEB:   /rentback-app-web/lib/i18n.ts
// ADMIN: /rentback-admin-web/lib/i18n.ts

import type { cookies as CookiesFn } from "next/headers";

/** ========== Types ========== */
export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

export type CommonCopy = {
  brand: string;     // “RentBack” (logo text)
  signIn: string;
  admin: string;
  mainSite: string;
  founder: string;
  privacy: string;
  terms: string;
  contact: string;
};

export type LandingCopy = {
  // Used by web/app/page.tsx
  h1: string;
  sub: string;
  cta: string;
  learn: string;     // <- required by your page for the secondary button
};

export type AdminLandingCopy = {
  // Used by admin/app/page.tsx
  title: string;
  subtitle: string;
  cta: string;        // keep for compatibility
  signInCta: string;  // <- page expects this name
  bullets: string[];  // <- page maps over this
};

export type Copy = {
  common: CommonCopy;
  landing: LandingCopy;
  adminLanding: AdminLandingCopy;
};

/** ========== Dictionaries ========== */
const COPY: Record<Lang, Copy> = {
  en: {
    common: {
      brand: "RentBack",
      signIn: "Sign in",
      admin: "Admin",
      mainSite: "Go to Main Site",
      founder: "Founder",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
    },
    landing: {
      h1: "Pay rent, earn rewards.",
      sub:
        "A modern rent-payments experience for Pakistan — Raast, cards & wallets, and a local rewards marketplace.",
      cta: "Get started",
      learn: "Learn more",
    },
    adminLanding: {
      title: "RentBack Admin",
      subtitle: "Manage content, review activity, and configure settings.",
      cta: "Sign in to Admin",
      signInCta: "Sign in to Admin",
      bullets: [
        "Review recent payments & redemptions (demo)",
        "Manage content and copy",
        "Configure language & theme defaults",
      ],
    },
  },
  ur: {
    common: {
      brand: "RentBack",
      signIn: "سائن اِن",
      admin: "ایڈمن",
      mainSite: "مین سائٹ پر جائیں",
      founder: "بانی",
      privacy: "پرائیویسی",
      terms: "شرائط",
      contact: "رابطہ",
    },
    landing: {
      h1: "کرایہ ادا کریں، انعامات پائیں۔",
      sub:
        "پاکستان کے لیے جدید رینٹ پیمنٹس — راست، کارڈز و والیٹس، اور مقامی ریوارڈز مارکیٹ پلیس۔",
      cta: "شروع کریں",
      learn: "مزید جانیں",
    },
    adminLanding: {
      title: "RentBack ایڈمن",
      subtitle: "مواد مینج کریں، ایکٹیویٹی دیکھیں، اور سیٹنگز کنفیگر کریں۔",
      cta: "ایڈمن میں سائن اِن",
      signInCta: "ایڈمن میں سائن اِن",
      bullets: [
        "حالیہ پیمنٹس اور ریڈیمپشنز دیکھیں (ڈیمو)",
        "مواد اور کاپی مینج کریں",
        "زبان اور تھیم کی ڈیفالٹس کنفیگر کریں",
      ],
    },
  },
};

/** ========== Cookie helpers (SSR/CSR safe) ========== */
function readCookie(name: string): string | undefined {
  // Client side
  if (typeof document !== "undefined") {
    const m = document.cookie.match(
      new RegExp("(^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, "\\$&") + "=([^;]*)")
    );
    return m ? decodeURIComponent(m[2]) : undefined;
  }
  // Server side (Next.js)
  try {
    const { cookies } = require("next/headers") as { cookies: typeof CookiesFn };
    return cookies().get(name)?.value;
  } catch {
    return undefined;
  }
}

/** ========== Public API used by your pages/components ========== */
export function getCopy(lang: Lang): Copy {
  return COPY[lang] ?? COPY.en;
}

export function getLang(): Lang {
  const v = readCookie("rb-lang");
  return v === "ur" ? "ur" : "en";
}

export function getTheme(): Theme {
  const v = readCookie("rb-theme");
  return v === "dark" ? "dark" : "light";
}

export function getDir(lang?: Lang): "ltr" | "rtl" {
  const l = lang ?? getLang();
  return l === "ur" ? "rtl" : "ltr";
}
