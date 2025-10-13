// WEB & ADMIN — replace file: /lib/i18n.ts

import type { cookies as CookiesFn } from "next/headers";

// ----------------- Types -----------------
export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

export type CommonCopy = {
  brand: string;      // "RentBack" (UI/logo text stays unchanged)
  signIn: string;
  admin: string;
  mainSite: string;
  founder: string;
  privacy: string;
  terms: string;
  contact: string;
};

export type LandingCopy = {
  // These two are what app/page.tsx is using:
  h1: string;
  sub: string;
};

export type Copy = {
  common: CommonCopy;
  landing: LandingCopy;
};

// ----------------- Dictionaries -----------------
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
        "پاکستان کے لیے جدید رینٹ پیمنٹس—راست، کارڈز و والیٹس، اور مقامی ریوارڈز مارکیٹ پلیس۔",
    },
  },
};

// ----------------- Helpers (SSR/CSR-safe) -----------------
function readCookie(name: string): string | undefined {
  // Client-side
  if (typeof document !== "undefined") {
    const m = document.cookie.match(
      new RegExp("(^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)")
    );
    return m ? decodeURIComponent(m[2]) : undefined;
  }
  // Server-side (Next.js)
  try {
    // require to avoid bundling issues in client
    const { cookies } = require("next/headers") as { cookies: typeof CookiesFn };
    return cookies().get(name)?.value;
  } catch {
    return undefined;
  }
}

// ----------------- Public API -----------------
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
