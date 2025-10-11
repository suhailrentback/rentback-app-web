// lib/i18n.ts
import { cookies } from "next/headers";

export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

export function getLang(): Lang {
  const v = cookies().get("rb-lang")?.value as Lang | undefined;
  return v === "ur" ? "ur" : "en";
}

export function getTheme(): Theme {
  const v = cookies().get("rb-theme")?.value as Theme | undefined;
  return v === "dark" ? "dark" : "light";
}

export function getDir(lang: Lang): "ltr" | "rtl" {
  return lang === "ur" ? "rtl" : "ltr";
}

export function getCopy(lang: Lang) {
  const common = {
    brand: "RentBack",
    founder: lang === "ur" ? "بانی" : "Founder",
    signIn: lang === "ur" ? "سائن اِن" : "Sign in",
    signOut: lang === "ur" ? "لاگ آؤٹ" : "Sign out",
    privacy: lang === "ur" ? "پرائیویسی" : "Privacy",
    terms: lang === "ur" ? "شرائط" : "Terms",
    contact: lang === "ur" ? "رابطہ" : "Contact",
    demo: lang === "ur" ? "ڈیمو موڈ" : "Demo Mode",
    mainSite: lang === "ur" ? "مین سائٹ" : "Main Site",
  };

  const landing = {
    h1a: lang === "ur" ? "کرایہ ادا کریں،" : "Pay rent, earn",
    h1b: lang === "ur" ? "انعامات حاصل کریں۔" : "rewards.",
    sub:
      lang === "ur"
        ? "پاکستان کے لیے جدید کرایہ ادائیگی — راست، کارڈز اور والیٹس، اور مقامی ریوارڈز مارکیٹ پلیس۔"
        : "A modern rent-payments experience for Pakistan — Raast, cards & wallets, and a local rewards marketplace.",
    cta: lang === "ur" ? "شروع کریں" : "Get started",
    learn: lang === "ur" ? "مزید جانیں" : "Learn more",
    point1:
      lang === "ur"
        ? "راست، کارڈ یا والیٹ سے ادائیگی"
        : "Pay via Raast, card, or wallet",
    point2:
      lang === "ur"
        ? "پوائنٹس کمائیں اور مقامی برانڈز پر ریڈیم کریں"
        : "Earn points and redeem with local brands",
    point3:
      lang === "ur"
        ? "English/اردو، لائٹ/ڈارک، موبائل فرسٹ"
        : "English/Urdu, light/dark, mobile-first",
    mockNote:
      lang === "ur" ? "صرف پری ویو کے لیے ماک کارڈ UI۔" : "Mock card UI for preview only.",
  };

  return { common, landing } as const;
}
