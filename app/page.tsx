// app/page.tsx (web)
// Brand-consistent public landing (EN/UR, theme toggle). No duplicate keys.
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [lang, setLang] = useState<"en" | "ur">("en");

  // hydrate from localStorage
  useEffect(() => {
    try {
      const t = localStorage.getItem("rb-theme");
      const l = localStorage.getItem("rb-lang");
      if (t === "light" || t === "dark") setTheme(t);
      if (l === "en" || l === "ur") setLang(l);
    } catch {}
  }, []);

  // apply to <html>
  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ur" ? "rtl" : "ltr");
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("rb-theme", theme);
      localStorage.setItem("rb-lang", lang);
    } catch {}
  }, [theme, lang]);

  const t = copy[lang];
  const dir = lang === "ur" ? "rtl" : "ltr";

  return (
    <div
      className="min-h-screen bg-white text-slate-900 dark:bg-[#0b0b0b] dark:text-white"
      style={{ direction: dir }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Brand />
          <nav className="flex items-center gap-2">
            <Link
              href="/founder"
              className="px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            >
              {t.founder}
            </Link>
            <button
              onClick={() => setLang((p) => (p === "en" ? "ur" : "en"))}
              className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="toggle language"
            >
              {lang === "en" ? "اردو" : "English"}
            </button>
            <button
              onClick={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
              className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="toggle theme"
            >
              {theme === "dark" ? t.light : t.dark}
            </button>
            <Link
              href="/sign-in"
              className="px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t.signIn}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4">
        <section className="py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              {t.h1a}{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                {t.h1b}
              </span>
            </h1>
            <p className="mt-4 text-lg opacity-80">{t.sub}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-in"
                className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {t.cta}
              </Link>
              <a
                href="#features"
                className="px-5 py-3 rounded-xl font-semibold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {t.learn}
              </a>
            </div>

            <ul className="mt-8 space-y-2 text-sm opacity-80">
              <li>• {t.point1}</li>
              <li>• {t.point2}</li>
              <li>• {t.point3}</li>
            </ul>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 blur-3xl opacity-30 hidden dark:block"
              style={{
                background:
                  "conic-gradient(from 90deg at 50% 50%, #059669, #10b981, #34d399)",
              }}
            />
            <div className="relative rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-6">
              <MockCard />
            </div>
            <p className="mt-3 text-xs opacity-70">{t.mockNote}</p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-12 grid md:grid-cols-3 gap-6">
          {features(lang).map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-black/10 dark:border-white/10 p-5 bg-white dark:bg-white/5"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-400/10 flex items-center justify-center mb-3">
                <span className="text-emerald-700 dark:text-emerald-300">✓</span>
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm opacity-80 mt-1">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="py-10 text-xs opacity-70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              © {new Date().getFullYear()} RentBack Technologies (Pvt) Ltd
            </span>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="hover:opacity-100 opacity-80"
              >
                {t.privacy}
              </Link>
              <Link
                href="/founder"
                className="hover:opacity-100 opacity-80"
              >
                {t.founder}
              </Link>
              <a href="#" className="hover:opacity-100 opacity-80">
                {t.terms}
              </a>
              <a
                href="mailto:help@rentback.app"
                className="hover:opacity-100 opacity-80"
              >
                {t.contact}
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function MockCard() {
  return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg">
      <div className="flex items-center justify-between text-sm opacity-90">
        <span>RentBack</span>
        <span>PK</span>
      </div>
      <div className="mt-6 text-2xl font-semibold tracking-widest">
        6032 • • • • • • 3912
      </div>
      <div className="mt-6 text-sm opacity-90">BILL PAY • RAAST • REWARDS</div>
      <div className="mt-8 flex items-center justify-between text-sm">
        <span>VALID THRU 12/27</span>
        <span>MR RENTER</span>
      </div>
    </div>
  );
}

const copy = {
  en: {
    signIn: "Sign in",
    founder: "Founder",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    h1a: "Pay rent, earn",
    h1b: "rewards.",
    sub:
      "A modern rent-payments experience for Pakistan — Raast, cards & wallets, and a local rewards marketplace.",
    cta: "Get started",
    learn: "Learn more",
    point1: "Pay via Raast, card, or wallet",
    point2: "Earn points and redeem with local brands",
    point3: "English/Urdu, light/dark, mobile-first",
    mockNote: "Mock card UI for preview only.",
    light: "Light",
    dark: "Dark",
  },
  ur: {
    signIn: "سائن اِن",
    founder: "بانی",
    privacy: "پرائیویسی",
    terms: "شرائط",
    contact: "رابطہ",
    h1a: "کرایہ ادا کریں،",
    h1b: "انعامات حاصل کریں۔",
    sub:
      "پاکستان کے لیے جدید کرایہ ادائیگی کا تجربہ — راست، کارڈز اور والیٹس، اور مقامی ریوارڈز مارکیٹ پلیس۔",
    cta: "شروع کریں",
    learn: "مزید جانیں",
    point1: "راست، کارڈ یا والیٹ سے ادائیگی",
    point2: "پوائنٹس کمائیں اور مقامی برانڈز پر ریڈیم کریں",
    point3: "English/اردو، لائٹ/ڈارک، موبائل فرسٹ",
    mockNote: "صرف پری ویو کے لیے ماک کارڈ یو آئی۔",
    light: "لائٹ",
    dark: "ڈارک",
  },
} as const;

function features(lang: "en" | "ur") {
  return lang === "en"
    ? [
        {
          title: "Raast native",
          desc: "Bank transfer rails with references matched to receipts.",
        },
        {
          title: "Rewards engine",
          desc: "Points accrual, promo codes, and a marketplace to redeem.",
        },
        {
          title: "Built for PK",
          desc: "PKR formatting, Urdu support, and fintech-grade UI.",
        },
      ]
    : [
        {
          title: "راست انٹیگریشن",
          desc: "بینک ٹرانسفر کے ذریعے ریفرنس کے ساتھ رسید میچنگ۔",
        },
        {
          title: "ریوارڈز انجن",
          desc: "پوائنٹس، پرومو کوڈز، اور ریڈیم مارکیٹ پلیس۔",
        },
        {
          title: "پاکستان کے لیے",
          desc: "PKR فارمیٹنگ، اردو سپورٹ، اور جدید فن ٹیک UI۔",
        },
      ];
}
