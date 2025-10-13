// ✅ COPY–PASTE THIS FILE INTO *BOTH* REPOS
// WEB:   /rentback-app-web/lib/i18n.ts
// ADMIN: /rentback-admin-web/lib/i18n.ts

import type { cookies as CookiesFn } from "next/headers";

export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

export type CommonCopy = {
  brand: string;
  signIn: string;
  admin: string;
  mainSite: string;
  founder: string;
  privacy: string;
  terms: string;
  contact: string;
};

export type LandingCopy = {
  // used by WEB /app/page.tsx
  h1: string;
  sub: string;
  cta: string;
  learn: string;
  bullets: string[];
};

export type AdminLandingCopy = {
  // used by ADMIN /app/page.tsx
  title: string;
  subtitle: string;
  cta: string;
  signInCta: string;
  bullets: string[];
};

export type Copy = {
  common: CommonCopy;
  landing: LandingCopy;
  adminLanding: AdminLandingCopy;
};

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
      bullets: [
        "Raast, cards & wallets — demo flow",
        "Earn local rewards on rent",
        "English + Urdu (RTL) supported",
      ],
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
      bullets: [
        "راست، کارڈز اور والیٹس — ڈیمو فلو",
        "کرائے پر مقامی انعامات حاصل کریں",
        "انگریزی + اردو (RTL) سپورٹڈ",
      ],
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

/* ------------ cookie helpers (SSR + CSR safe, no regex) ------------ */
function readCookie(name: string): string | undefined {
  // Client: parse document.cookie safely (no regex to avoid build issues)
  if (typeof document !== "undefined") {
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    const prefix = name + "=";
    const found = cookies.find((c) => c.startsWith(prefix));
    return found ? decodeURIComponent(found.slice(prefix.length)) : undefined;
  }
  // Server: Next.js headers API (guarded for non-server contexts)
  try {
    const { cookies } = require("next/headers") as { cookies: typeof CookiesFn };
    return cookies().get(name)?.value;
  } catch {
    return undefined;
  }
}

/* ------------ public API used in your pages ------------ */
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
