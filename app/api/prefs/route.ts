// USE IN BOTH REPOS: rentback-app-web AND rentback-admin-web
// app/api/prefs/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { Lang, Theme } from "@/lib/i18n";

export async function POST(req: Request) {
  const { lang, theme } = (await req.json().catch(() => ({}))) as {
    lang?: Lang;
    theme?: Theme;
  };

  const host = headers().get("host") || "";
  const domain = host.endsWith("rentback.app") ? ".rentback.app" : undefined;

  const res = NextResponse.json({ ok: true });

  if (lang && (lang === "en" || lang === "ur")) {
    res.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365, domain });
  }
  if (theme && (theme === "light" || theme === "dark")) {
    res.cookies.set("theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365, domain });
  }

  return res;
}
