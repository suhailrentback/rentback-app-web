// app/api/prefs/route.ts
import { NextResponse } from "next/server";
import { LANG_COOKIE, THEME_COOKIE } from "@/lib/i18n";
import type { Lang, Theme } from "@/lib/i18n";

export const runtime = "edge"; // fine for setting cookies; keep it lean

export async function POST(req: Request) {
  let lang: Lang | undefined;
  let theme: Theme | undefined;

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<{
      lang: Lang;
      theme: Theme;
    }>;
    lang = body.lang;
    theme = body.theme;
  } catch {
    // ignore malformed JSON; we'll still return ok:false
  }

  const res = NextResponse.json({ ok: true });

  if (lang === "en" || lang === "ur") {
    res.cookies.set(LANG_COOKIE, lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  if (theme === "light" || theme === "dark" || theme === "system") {
    res.cookies.set(THEME_COOKIE, theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return res;
}
