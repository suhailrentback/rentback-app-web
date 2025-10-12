// USE IN BOTH REPOS: rentback-app-web AND rentback-admin-web
// lib/i18n.ts
import { cookies, headers } from "next/headers";

/** Theme & language */
export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

/** Copy types shared by web + admin */
export type CommonCopy = {
  signIn: string;
  privacy: string;
  terms: string;
  contact: string;
  admin?: string;
  mainSite?: string;
  founder?: string;
};

export type LandingCopy = {
  h1a: string;
  h1b: string;
  sub: string;
  cta: string;
  learnMore: string;
  bullets: string[];
};

export type AdminLandingCopy = {
  title: string;
  subtitle: string;
  notes: string[];
  kpis: { label: string; value: string; sub: string }[];
  mockNote: string;
};

export type Copy = {
  common: CommonCopy;
  landing?: LandingCopy;           // web landing
  adminLanding?: AdminLandingCopy; // admin landing
};

/** Read prefs (server) */
export const getLang = (): Lang => {
  const v = cookies().get("lang")?.value as Lang | undefined;
  return v === "ur" ? "ur" : "en";
};

export const getTheme = (): Theme => {
  const v = cookies().get("theme")?.value as Theme | undefined;
  return v === "dark" ? "dark" : "light";
};

export const getDir = (lang?: Lang): "ltr" | "rtl" =>
  (lang ?? getLang()) === "ur" ? "rtl" : "ltr";

/** Cookie scope for prod cross-subdomain */
export const cookieDomain = () => {
  const host = headers().get("host") || "";
  return host.endsWith("rentback.app") ? ".rentback.app" : undefined;
};

/** Dictionaries */
const en: Copy = {
  common: {
    signIn: "Sign in",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    admin: "Admin",
    mainSite: "Main Site",
    founder: "Founder",
  },
  landing: {
    h1a: "Pay rent, earn rewards.",
    h1b: "A modern rent-payments experience for Pakistan.",
    sub: "Raast, cards & wallets, and a local rewards marketplace.",
    cta: "Get started",
    learnMore: "Learn more",
    bullets: [
      "Pay via Raast, card, or wallet",
      "Earn points and redeem with local brands",
      "English/Urdu, light/dark, mobile-first",
    ],
  },
  adminLanding: {
    title: "RentBack Admin",
    subtitle:
      "Secure operations console for payouts, reconciliation, rewards, tenants, and staff roles.",
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

const ur: Copy = {
  common: {
    signIn: "سائن اِن",
    privacy: "پرائیویسی",
    terms: "شرائط",
    contact: "رابطہ",
    admin: "ایڈمن",
    mainSite: "مرکزی سائٹ",
    founder: "بانی",
  },
  landing: {
    h1a: "کرایہ ادا کریں، انعام پائیں۔",
    h1b: "پاکستان کے لیے جدید رینٹ پیمنٹس تجربہ۔",
    sub: "راست، کارڈز اور والٹس، اور مقامی ریوارڈز مارکیٹ پلیس۔",
    cta: "شروع کریں",
    learnMore: "مزید جانیں",
    bullets: [
      "راست، کارڈ یا والٹ کے ذریعے ادائیگی",
      "پوائنٹس کمائیں اور مقامی برانڈز پر ریڈیم کریں",
      "اردو/انگریزی، لائٹ/ڈارک، موبائل فرسٹ",
    ],
  },
  adminLanding: {
    title: "رینٹ بیک ایڈمن",
    subtitle:
      "ادائیگیوں، مفاہمت، انعامات، کرایہ داروں اور اسٹاف رولز کے لیے محفوظ کنسول۔",
    notes: [
      "رسائی صرف admin@rentback.app اور منظور شدہ اسٹاف کے لیے ہے۔",
      "کم از کم اختیارات، آڈٹ لاگز اور 2FA کی سفارش کی جاتی ہے۔",
      "محفوظ ڈیوائس اور نجی نیٹ ورک پر ایڈمن استعمال کریں۔",
    ],
    kpis: [
      { label: "آج", value: "PKR 2,450,000", sub: "جمع" },
      { label: "کھلے ٹکٹس", value: "7", sub: "SLA < 24h" },
      { label: "زیر التواء ادائیگیاں", value: "12", sub: "کٹ آف 6pm PKT" },
      { label: "رسک فلیگز", value: "3", sub: "ریویو قطار" },
    ],
    mockNote: "یہ صرف پری ویو کے لیے فرضی ویجٹس ہیں۔",
  },
};

/** Public getter */
export const getCopy = (lang: Lang): Copy => (lang === "ur" ? ur : en);
