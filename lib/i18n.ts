// WEB /lib/i18n.ts
"use client";

export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem("rb-lang");
  return v === "ur" ? "ur" : "en";
}

export function setLang(lang: Lang) {
  try {
    window.localStorage.setItem("rb-lang", lang);
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", getDir(lang));
  } catch {}
}

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem("rb-theme");
  return v === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem("rb-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch {}
}

export function getDir(lang?: Lang): "ltr" | "rtl" {
  const l = lang ?? getLang();
  return l === "ur" ? "rtl" : "ltr";
}

/* ===== Copy types ===== */
export type CommonCopy = {
  brand: "RentBack";
  signIn: string;
  admin: string;
  mainSite: string;
  langNames: { en: string; ur: string };
  themeNames: { light: string; dark: string };
  footer: { privacy: string; terms: string; contact: string; copyright: string };
};

export type LandingCopy = {
  h1a: string;
  h1b: string;
  subtitle: string;
  cta: string;
  learnMore: string;
  featureBullets: string[];
  cardBadge: string;
  cardNote: string;
  checks: { raast: string; rewards: string; builtForPk: string };
};

export type SignInCopy = {
  title: string;
  subtitle: string;
  emailLabel: string;
  magicCta: string;
  otpCta: string;
  back: string;
};

export type Copy = {
  common: CommonCopy;
  landing: LandingCopy;
  auth: { signIn: SignInCopy };
};

const copy: Record<Lang, Copy> = {
  en: {
    common: {
      brand: "RentBack",
      signIn: "Sign in",
      admin: "Admin",
      mainSite: "Go to Main Site",
      langNames: { en: "English", ur: "اردو" },
      themeNames: { light: "Light", dark: "Dark" },
      footer: {
        privacy: "Privacy",
        terms: "Terms",
        contact: "Contact",
        copyright: "© 2025 RentBack Technologies (Pvt) Ltd",
      },
    },
    landing: {
      h1a: "Pay rent, earn rewards.",
      h1b: "A modern rent-payments experience for Pakistan.",
      subtitle: "Raast, cards & wallets, and a local rewards marketplace.",
      cta: "Get started",
      learnMore: "Learn more",
      featureBullets: [
        "Pay via Raast, card, or wallet",
        "Earn points and redeem with local brands",
        "English/Urdu, light/dark, mobile-first",
      ],
      cardBadge: "BILL PAY • RAAST • REWARDS",
      cardNote: "Mock card UI for preview only.",
      checks: {
        raast: "Raast native — bank transfer rails with matched receipts.",
        rewards: "Rewards engine — points accrual and marketplace.",
        builtForPk: "Built for PK — PKR formatting & Urdu support.",
      },
    },
    auth: {
      signIn: {
        title: "Welcome to RentBack",
        subtitle: "A modern rent-payments experience — Raast, cards & wallets, and local rewards.",
        emailLabel: "Email address",
        magicCta: "Continue",
        otpCta: "Use OTP",
        back: "Back",
      },
    },
  },
  ur: {
    common: {
      brand: "RentBack",
      signIn: "سائن اِن",
      admin: "ایڈمن",
      mainSite: "مین سائٹ",
      langNames: { en: "English", ur: "اردو" },
      themeNames: { light: "لائٹ", dark: "ڈارک" },
      footer: {
        privacy: "پرائیویسی",
        terms: "شرائط",
        contact: "رابطہ",
        copyright: "© 2025 RentBack Technologies (Pvt) Ltd",
      },
    },
    landing: {
      h1a: "کرایہ ادا کریں، انعامات حاصل کریں۔",
      h1b: "پاکستان کے لیے جدید رینٹ پیمنٹس تجربہ۔",
      subtitle: "راست، کارڈز اور والیٹس — مقامی ریوارڈز مارکیٹ پلیس کے ساتھ۔",
      cta: "شروع کریں",
      learnMore: "مزید جانیں",
      featureBullets: [
        "راست، کارڈ یا والیٹ سے ادائیگی",
        "پوائنٹس کمائیں اور مقامی برانڈز سے ریڈیم کریں",
        "اردو/انگریزی، لائٹ/ڈارک، موبائل فرسٹ",
      ],
      cardBadge: "بل پے • راست • ریوارڈز",
      cardNote: "صرف پریویو کے لیے ماک کارڈ UI۔",
      checks: {
        raast: "راست نیٹِو — بینک ٹرانسفر ریلز اور میچڈ رسیدیں۔",
        rewards: "ریوارڈز انجن — پوائنٹس اور مارکیٹ پلیس۔",
        builtForPk: "پاکستان کے لیے — PKR فارمیٹنگ اور اردو سپورٹ۔",
      },
    },
    auth: {
      signIn: {
        title: "RentBack میں خوش آمدید",
        subtitle: "جدید رینٹ پیمنٹس — راست، کارڈز/والیٹس، اور مقامی ریوارڈز۔",
        emailLabel: "ای میل",
        magicCta: "جاری رکھیں",
        otpCta: "OTP استعمال کریں",
        back: "واپس",
      },
    },
  },
};

export function getCopy(lang?: Lang): Copy {
  const l = lang ?? getLang();
  return copy[l];
}
