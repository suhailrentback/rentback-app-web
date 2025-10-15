// components/FloatingLangSwitch.tsx
"use client";

import { useI18n } from "@/lib/i18n";

export default function FloatingLangSwitch() {
  const { lang, setLang } = useI18n();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        role="tablist"
        aria-label="Language"
        className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm"
      >
        <button
          role="tab"
          aria-selected={lang === "en"}
          aria-label="Switch to English"
          onClick={() => setLang("en")}
          className={`min-w-[44px] rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            lang === "en" ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          EN
        </button>
        <button
          role="tab"
          aria-selected={lang === "ur"}
          aria-label="Switch to Urdu"
          onClick={() => setLang("ur")}
          className={`min-w-[44px] rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            lang === "ur" ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          اُردو
        </button>
      </div>
    </div>
  );
}
