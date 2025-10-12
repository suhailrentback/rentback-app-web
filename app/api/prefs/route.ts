// app/api/prefs/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const oneYear = 60 * 60 * 24 * 365;
  let lang: "en" | "ur" | undefined;
  let theme: "light" | "dark" | undefined;

  try {
    const body = await req.json();
    if (body?.lang === "en" || body?.lang === "ur") lang = body.lang;
    if (body?.theme === "light" || body?.theme === "dark") theme = body.theme;
  } catch {
    // ignore malformed body; we’ll still return ok=false below if nothing valid
  }

  const res = NextResponse.json({ ok: Boolean(lang || theme) });

  if (lang) {
    res.cookies.set("rb_lang", lang, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      maxAge: oneYear,
    });
  }
  if (theme) {
    res.cookies.set("rb_theme", theme, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      maxAge: oneYear,
    });
  }

  return res;
}
