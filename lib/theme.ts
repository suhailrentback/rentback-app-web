// lib/theme.ts
// Server-only theme helper used by Header/layout.
// No UI changes. Reads "theme" cookie; defaults to "light".

import { cookies } from "next/headers";

export type Theme = "light" | "dark";

export function getTheme(): Theme {
  try {
    const v = cookies().get("theme")?.value;
    if (v === "dark" || v === "light") return v;
  } catch {
    // noop — fall back below
  }
  return "light";
}
