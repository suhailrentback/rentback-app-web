// lib/i18n.ts
import { cookies } from "next/headers";

export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

/** Read cookies (server) */
export const getLang = (): Lang => {
  const v = cookies().get("lang")?.value as Lang | undefined;
  return v === "ur" ? "ur" : "en";
};
export const getTheme = (): Theme => {
  const v = cookies().get("theme")?.value as Theme | undefined;
  return v === "dark" ? "dark" : "light";
};
/** Accepts optional arg so both getDir() and getDir(lang) work */
export const getDir = (lang?: Lang): "ltr" | "rtl" =>
  (lang ?? getLang()) === "ur" ? "rtl" : "ltr";

/** Server actions for toggles */
export const setLang = async (lang: Lang) => {
  "use server";
  cookies().set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
};
export const setTheme = async (theme: Theme) => {
  "use server";
  cookies().set("theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365 });
};

/** ---- Typed copy ---- */
export interface CommonCopy {
  brand: string;
  signIn: string;
  founder?: string;
  admin?: string;
  mainSite?: string;
  privacy: string;
  terms: string;
  contact: string;
  demo?: string;
}
export interface LandingCopy {
  h1a: string;
  h1b: string;
  heroSubtitle: string;
  cta: string;
  ctaSecondary: string;
  bullets: string[];
}
export interface AdminLandingCopy {
  title: string;
  subtitle: string;
  signInAdmin?: string;
  goToMain?: string;
  notes?: string[];
  dashboardSample?: {
    collectedToday: string;
    openTickets: string;
    pendingPayouts: string;
    riskFlags: string;
    tagPreview: string;
  };
}
export interface Copy {
  common: CommonCopy;
  landing: LandingCopy;
  adminLanding: AdminLandingCopy;
}

/** ---- Dictionaries ---- */
const COPY: Record<Lang, Copy> = {
  en: {
    common: {
      brand: "RentBack",
      signIn: "Sign in",
      founder: "Founder",
      admin: "Admin",
      mainSite: "Main Site",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
      demo: "Continue in Demo Mode",
    },
    landing: {
      h1a: "Pay rent, earn rewards.",
      h1b: "A modern rent-payments experience for Pakistan.",
      heroSubtitle:
        "Raast, cards & wallets, and a local rewards marketplace.",
      cta: "Get started",
      ctaSecondary: "Learn more",
      bullets: [
        "Pay via Raast, card, or wallet",
        "Earn points; redeem with local brands",
        "English/Urdu, light/dark, mobile-first",
      ],
    },
    adminLanding: {
      title: "RentBack Admin",
      subtitle:
        "Secure operations console for payouts, reconciliation, rewards, tenants, and staff roles.",
      signInAdmin: "Sign in to Admin",
      goToMain: "Go to Main Site",
      notes: [
        "Access is restricted to admin@rentback.app and approved staff.",
        "Least-privilege roles, audit logs, and 2FA recommended.",
        "Use a secure device and private network when accessing Admin.",
      ],
      dashboardSample: {
        collectedToday: "Collected (Today)",
        openTickets: "Open Tickets",
        pendingPayouts: "Pending Payouts",
        riskFlags: "Risk Flags",
        tagPreview: "Review queue",
      },
    },
  },
  ur: {
    common: {
      brand: "رینٹ بیک",
      signIn: "سائن اِن",
      founder: "بانی",
      admin: "ایڈمن",
      mainSite: "مرکزی سائٹ",
      privacy: "پرائیویسی",
      terms: "شرائط",
      contact: "رابطہ",
      demo: "ڈیمو موڈ میں جاری رکھیں",
    },
    landing: {
      h1a: "کِرایہ دیں، انعام پائیں۔",
      h1b: "پاکستان کے لیے جدید رینٹ پیمنٹس۔",
      heroSubtitle:
        "راست، کارڈز اور والٹس، اور مقامی انعامات مارکیٹ پلیس۔",
      cta: "شروع کریں",
      ctaSecondary: "مزید جانیں",
      bullets: [
        "راست، کارڈ یا والٹ کے ذریعے ادائیگی",
        "پوائنٹس کمائیں؛ مقامی برانڈز پر ریڈیم کریں",
        "اردو/انگریزی، لائٹ/ڈارک، موبائل فرسٹ",
      ],
    },
    adminLanding: {
      title: "رینٹ بیک ایڈمن",
      subtitle:
        "پے آؤٹس، ریکنسیلی ایشن، ریوارڈز، کرایہ دار اور اسٹاف رولز کے لیے محفوظ کنسول۔",
      signInAdmin: "ایڈمن میں سائن اِن کریں",
      goToMain: "مرکزی سائٹ پر جائیں",
      notes: [
        "رسائی صرف admin@rentback.app اور منظور شدہ اسٹاف تک محدود ہے۔",
        "کم سے کم مراعات والے رولز، آڈٹ لاگز اور 2FA تجویز کی جاتی ہے۔",
        "ایڈمن تک رسائی کے لیے محفوظ ڈیوائس اور نجی نیٹ ورک استعمال کریں۔",
      ],
      dashboardSample: {
        collectedToday: "آج موصول",
        openTickets: "کھلے ٹکٹس",
        pendingPayouts: "زیرِالتوا پے آؤٹس",
        riskFlags: "رسک فلیگز",
        tagPreview: "جائزہ قطار",
      },
    },
  },
};

export const getCopy = (lang: Lang = getLang()): Copy => COPY[lang];
