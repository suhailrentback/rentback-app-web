// WEB: place in rentback-app-web/lib/i18n.ts
import { cookies } from "next/headers";

export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

type CommonCopy = {
  signIn: string;
  admin: string;
  privacy: string;
  terms: string;
  contact: string;
};

type LandingCopy = {
  h1: string;
  sub: string;
  cta: string;
  learn: string;
  bullets: string[];
};

export type Copy = {
  common: CommonCopy;
  landing: LandingCopy;
};

export function getLang(): Lang {
  const c = cookies().get("rb_lang")?.value;
  return c === "ur" ? "ur" : "en";
}

export function getTheme(): Theme {
  const c = cookies().get("rb_theme")?.value;
  return c === "dark" ? "dark" : "light";
}

export function getDir(lang?: Lang): "ltr" | "rtl" {
  const l = lang ?? getLang();
  return l === "ur" ? "rtl" : "ltr";
}

export function getCopy(lang: Lang): Copy {
  const en: Copy = {
    common: {
      signIn: "Sign in",
      admin: "Admin",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
    },
    landing: {
      h1: "Pay rent, earn rewards.",
      sub: "A modern rent-payments experience for Pakistan — Raast, cards & wallets, and a local rewards marketplace.",
      cta: "Get started",
      learn: "Learn more",
      bullets: [
        "Pay via Raast, card, or wallet",
        "Earn points and redeem with local brands",
        "English/Urdu, light/dark, mobile-first",
      ],
    },
  };

  const ur: Copy = {
    common: {
      signIn: "سائن اِن",
      admin: "ایڈمن",
      privacy: "پرائیویسی",
      terms: "شرائط",
      contact: "رابطہ",
    },
    landing: {
      h1: "کرایہ ادا کریں، انعامات کمائیں۔",
      sub: "پاکستان کے لیے جدید رینٹ پیمنٹس — راست، کارڈز اور والیٹس، اور مقامی رِیواردز مارکیٹ پلیس۔",
      cta: "شروع کریں",
      learn: "مزید جانیں",
      bullets: [
        "راست، کارڈ یا والیٹ سے ادائیگی",
        "پوائنٹس کمائیں اور مقامی برانڈز کے ساتھ ریڈیم کریں",
        "انگلش/اردو، لائٹ/ڈارک، موبائل فرسٹ",
      ],
    },
  };

  return lang === "ur" ? ur : en;
}
