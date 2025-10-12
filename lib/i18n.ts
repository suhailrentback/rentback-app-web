// lib/i18n.ts
import { cookies } from "next/headers";

export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

export interface CommonCopy {
  signIn: string;
  privacy: string;
  terms: string;
  contact: string;
  founder?: string;
  admin?: string;
  mainSite?: string;
  continueDemo?: string;
}

export interface LandingCopy {
  heroTitle: string;
  heroSubtitle: string;
  bullets: string[];
  // Back-compat with older pages:
  cta?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
}

export interface AdminLandingCopy {
  heroTitle: string;
  heroSubtitle: string;
  notes?: string[];
  signInAdmin?: string;
  goToMain?: string;
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

const en: Copy = {
  common: {
    signIn: "Sign in",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    founder: "Founder",
    admin: "Admin",
    mainSite: "Main Site",
    continueDemo: "Continue in Demo Mode",
  },
  landing: {
    heroTitle: "Pay rent, earn rewards.",
    heroSubtitle:
      "A modern rent-payments experience for Pakistan — Raast, cards & wallets, and a local rewards marketplace.",
    bullets: [
      "Pay via Raast, card, or wallet",
      "Earn points and redeem with local brands",
      "English/Urdu, light/dark, mobile-first",
    ],
    cta: "Get started",
    ctaPrimary: "Get started",
    ctaSecondary: "Learn more",
  },
  adminLanding: {
    heroTitle: "RentBack Admin",
    heroSubtitle:
      "Secure operations console for payouts, reconciliation, rewards, tenants, and staff roles.",
    notes: [
      "Access is restricted to admin@rentback.app and approved staff.",
      "Least-privilege roles, audit logs, and 2FA recommended.",
      "Use a secure device and private network when accessing Admin.",
    ],
    signInAdmin: "Sign in to Admin",
    goToMain: "Go to Main Site",
    dashboardSample: {
      collectedToday: "Collected Today",
      openTickets: "Open Tickets",
      pendingPayouts: "Pending Payouts",
      riskFlags: "Risk Flags",
      tagPreview: "Mock admin widgets for preview only.",
    },
  },
};

const ur: Copy = {
  common: {
    signIn: "سائن اِن",
    privacy: "پرائیویسی",
    terms: "شرائط",
    contact: "رابطہ",
    founder: "بانی",
    admin: "ایڈمن",
    mainSite: "مین سائٹ",
    continueDemo: "ڈیمو موڈ جاری رکھیں",
  },
  landing: {
    heroTitle: "کرایہ ادا کریں، انعام کمائیں۔",
    heroSubtitle:
      "پاکستان کے لیے جدید کرایہ ادائیگی — راست، کارڈز/والٹس، اور مقامی ریوارڈز مارکیٹ پلیس۔",
    bullets: [
      "راست، کارڈ یا والٹ کے ذریعے ادائیگی",
      "پوائنٹس کمائیں اور مقامی برانڈز پر ریڈیم کریں",
      "انگریزی/اردو، لائٹ/ڈارک، موبائل فرسٹ",
    ],
    cta: "شروع کریں",
    ctaPrimary: "شروع کریں",
    ctaSecondary: "مزید جانیں",
  },
  adminLanding: {
    heroTitle: "RentBack Admin",
    heroSubtitle:
      "پے آؤٹس، ریکنسِلی ایشن، ریوارڈز، کرایہ داران اور اسٹاف رولز کے لیے محفوظ کنسول۔",
    notes: [
      "رسائی صرف admin@rentback.app اور منظور شدہ اسٹاف کے لیے ہے۔",
      "کم سے کم اختیارات والے رولز، آڈٹ لاگز اور 2FA کی تجویز دی جاتی ہے۔",
      "ایڈمن تک رسائی کے لیے محفوظ ڈیوائس اور پرائیویٹ نیٹ ورک استعمال کریں۔",
    ],
    signInAdmin: "ایڈمن میں سائن اِن",
    goToMain: "مین سائٹ پر جائیں",
    dashboardSample: {
      collectedToday: "آج جمع شدہ",
      openTickets: "کھلی ٹکٹس",
      pendingPayouts: "زیر التواء ادائیگیاں",
      riskFlags: "رسک فلیگز",
      tagPreview: "صرف پیش نظارہ کے لیے موک ویجٹس۔",
    },
  },
};

export function getLang(): Lang {
  const c = cookies();
  const val = c.get("rb_lang")?.value as Lang | undefined;
  return val === "ur" ? "ur" : "en";
}

export function getTheme(): Theme {
  const c = cookies();
  const val = c.get("rb_theme")?.value as Theme | undefined;
  return val === "dark" ? "dark" : "light";
}

export function getDir(lang?: Lang): "ltr" | "rtl" {
  const l = lang ?? getLang();
  return l === "ur" ? "rtl" : "ltr";
}

export function getCopy(lang?: Lang): Copy {
  const l = lang ?? getLang();
  return l === "ur" ? ur : en;
}
