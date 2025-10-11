// app/api/prefs/theme/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const jar = cookies();
  const current = jar.get("rb-theme")?.value === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  jar.set("rb-theme", next, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return NextResponse.json({ theme: next });
}
