// app/api/prefs/lang/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const jar = cookies();
  const current = jar.get("rb-lang")?.value === "ur" ? "ur" : "en";
  const next = current === "ur" ? "en" : "ur";
  jar.set("rb-lang", next, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return NextResponse.json({ lang: next });
}
