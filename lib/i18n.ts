// lib/i18n.ts
// Type-safe i18n with a strict Copy interface + compatibility shims (getLang/getDir/getTheme)

export type Lang = "en" | "ur";

/** Languages that should render Right-to-Left. */
const RTL_LANGS: readonly Lang[] = ["ur"];

export const STORAGE_LANG_KEY = "rb-lang";
export const STORAGE_THEME_KEY = "rb-theme";

/** Common strings used across the app (headers, footers, toggles). */
interface CommonCopy {
  brand: string;
  signIn: string;
  signOut: string;
  founder: string;
  privacy: string;
  terms: string;
  contact: string;
  dark: string;
  light: string;
  english: string;
  urdu: string;
  demo: string;
}

/** Landing page strings. */
interface LandingCopy {
  h1a: string;
  h1b: string;
  sub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  bullets: string[];
  mockNote: string;
  features: Array<{ title: string; desc: string }>;
}

/** Sign-in page strings. */
interface SignInCopy {
  title: string;
  subtitle: string;
  emailLabel: string;
  magicLinkCta: string;
  adminLink?: string;
}

/** Admin landing page strings (for admin.rentback.app). */
interface AdminLandingCopy {
  title: string;
  subtitle: string;
  signInCta: string;
  goMainSite: string;
  notes: string[];
  kpis: Array<{ label: string; value: string; sub: string }>;
  mockNote: string;
}

/** Top-level shape that both languages must implement. */
export interface Copy {
  common: CommonCopy;
  landing: LandingCopy;
  signIn: SignInCopy;
  adminLanding: AdminLandingCopy;
}

/* ---------------- EN ---------------- */
const en: Copy = {
  common: {
    brand: "RentBack",
    signIn: "Sign in",
    signOut: "Sign out",
    founder: "Founder",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    dark: "Dark",
    light: "Light",
    english: "English",
    urdu: "اردو",
    demo: "Continue in Demo Mode",
  },
  landing: {
    h1a: "Pay rent, earn",
    h1b: "rewards.",
    sub:
      "A modern rent-payments experience for Pakistan — Raast, cards & wallets, and a local rewards marketplace.",
    ctaPrimary: "Get started",
    ctaSecondary: "Learn more",
    bullets: [
      "Pay via Raast, card, or wallet",
      "Earn points and redeem with local brands",
      "English/Urdu, light/dark, mobile-first",
    ],
    mockNote: "Mock card UI for preview only.",
    features: [
      { title: "Raast native", desc: "Bank transfer rails with references matched to receipts." },
      { title: "Rewards engine", desc: "Points accrual, promo codes, and a marketplace to redeem." },
      { title: "Built for PK", desc: "PKR formatting, Urdu support, and fintech-grade UI." },
    ],
  },
  signIn: {
    title: "Sign in",
    subtitle: "RentBack — secure access",
    emailLabel: "Email",
    magicLinkCta: "Send magic link",
    adminLink: "Go to Admin",
  },
  adminLanding: {
    title: "RentBack Admin",
    subtitle:
      "Secure operations console for payouts, reconciliation, rewards, tenants, and staff roles.",
    signInCta: "Sign in to Admin",
    goMainSite: "Go to Main Site",
    notes: [
      "Access is restricted to admin@rentback.app and approved staff.",
      "Least-privilege roles, audit logs, and 2FA recommended.",
      "Use a secure device and private network when accessing Admin.",
    ],
    kpis: [
      { label: "Today", value: "PKR 2,450,000", sub: "Collected" },
      { label: "Open Tickets", value: "7", sub: "SLA < 24h" },
      { label: "Pending Payouts", value: "12", sub: "Cutoff 6pm PKT" },
      { label: "Risk Flags", value: "3", sub: "Review queue" },
    ],
    mockNote: "Mock admin widgets for preview only.",
  },
};

/* ---------------- UR ---------------- */
const ur: Copy = {
  common: {
    brand: "RentBack",
    signIn: "سائن اِن",
    signOut: "سائن آؤٹ",
    founder: "بانی",
    privacy: "پرائیویسی",
    terms: "شرائط",
    contact: "رابطہ",
    dark: "ڈارک",
    light: "لائٹ",
    english: "English",
    urdu: "اردو",
    demo: "ڈیمو موڈ میں جاری رکھیں",
  },
  landing: {
    h1a: "کرایہ ادا کریں،",
    h1b: "انعامات حاصل کریں۔",
    sub:
      "پاکستان کے لیے جدید کرایہ ادائیگی کا تجربہ — راست، کارڈز اور والیٹس، اور مقامی ریوارڈز مارکیٹ پلیس۔",
    ctaPrimary: "شروع کریں",
    ctaSecondary: "مزید جانیں",
    bullets: [
      "راست، کارڈ یا والیٹ سے ادائیگی",
      "پوائنٹس کمائیں اور مقامی برانڈز پر ریڈیم کریں",
      "English/اردو، لائٹ/ڈارک، موبائل فرسٹ",
    ],
    mockNote: "صرف پری ویو کے لیے ماک کارڈ یو آئی۔",
    features: [
      { title: "راست انٹیگریشن", desc: "بینک ٹرانسفر کے ذریعے ریفرنس کے ساتھ رسید میچنگ۔" },
      { title: "ریوارڈز انجن", desc: "پوائنٹس، پرومو کوڈز، اور ریڈیم مارکیٹ پلیس۔" },
      { title: "پاکستان کے لیے", desc: "PKR فارمیٹنگ، اردو سپورٹ، اور جدید فن ٹیک UI۔" },
    ],
  },
  signIn: {
    title: "سائن اِن",
    subtitle: "رینٹ بیک — محفوظ رسائی",
    emailLabel: "ای میل",
    magicLinkCta: "میجک لنک بھیجیں",
    adminLink: "ایڈمن پر جائیں",
  },
  adminLanding: {
    title: "RentBack ایڈمن",
    subtitle:
      "پے آؤٹس، ریکنسلی ایشن، ریوارڈز، کرایہ داروں اور اسٹاف رولز کے لیے محفوظ آپریشنز کنسول۔",
    signInCta: "ایڈمن میں سائن اِن",
    goMainSite: "مین سائٹ پر جائیں",
    notes: [
      "رسائی صرف admin@rentback.app اور منظور شدہ اسٹاف تک محدود ہے۔",
      "کم از کم مراعات والے رولز، آڈٹ لاگز اور 2FA کی سفارش کی جاتی ہے۔",
      "ایڈمن تک رسائی کے لیے محفوظ ڈیوائس اور پرائیویٹ نیٹ ورک استعمال کریں۔",
    ],
    kpis: [
      { label: "آج", value: "PKR 2,450,000", sub: "اکٹھا کیا گیا" },
      { label: "کھلے ٹکٹس", value: "7", sub: "SLA < 24h" },
      { label: "زیر التواء پے آؤٹس", value: "12", sub: "کٹ آف 6pm PKT" },
      { label: "رسک فلیگز", value: "3", sub: "ریویو کیو" },
    ],
    mockNote: "صرف پری ویو کے لیے ماک ایڈمن وِجٹس۔",
  },
};

/* -------- Registry & helpers -------- */
const REGISTRY: Record<Lang, Copy> = { en, ur };

export function normalizeLang(input?: string | null): Lang {
  const val = (input || "").toLowerCase();
  if (val.startsWith("ur")) return "ur";
  return "en";
}

export function getCopy(lang: Lang | string = "en"): Copy {
  const key = (typeof lang === "string" ? normalizeLang(lang) : lang) as Lang;
  return REGISTRY[key] || REGISTRY.en;
}

export function isRTL(lang: Lang | string): boolean {
  const key = normalizeLang(typeof lang === "string" ? lang : String(lang));
  return RTL_LANGS.includes(key as Lang);
}

export function getHtmlAttrs(lang: Lang | string = "en") {
  const l = normalizeLang(lang);
  return {
    lang: l,
    dir: isRTL(l) ? "rtl" : "ltr",
  } as const;
}

/* -------- Compatibility shims so existing imports keep working -------- */

/** Minimal cookie reader that works safely on client; server falls back to null. */
function readCookieSync(name: string): string | null {
  try {
    if (typeof document !== "undefined") {
      const pattern = new RegExp(
        "(?:^|; )" + name.replace(/[$()*+./?[\\\]^{|}-]/g, "\\$&") + "=([^;]*)"
      );
      const m = document.cookie.match(pattern);
      return m ? decodeURIComponent(m[1]) : null;
    }
  } catch {
    /* noop */
  }
  return null;
}

/** getLang(): preserves your existing API. Reads cookie on client; defaults to "en" on server. */
export function getLang(): Lang {
  const fromCookie = readCookieSync(STORAGE_LANG_KEY);
  return fromCookie === "ur" ? "ur" : "en";
}

/** getDir(): now accepts optional lang; if omitted, uses current cookie/default. */
export function getDir(input?: Lang | string): "rtl" | "ltr" {
  const l = input ?? getLang();
  return isRTL(l) ? "rtl" : "ltr";
}

/** getTheme(): reads "rb-theme" cookie on client; defaults to "dark" on server. */
export function getTheme(): "light" | "dark" {
  const fromCookie = readCookieSync(STORAGE_THEME_KEY);
  return fromCookie === "light" ? "light" : "dark";
}
