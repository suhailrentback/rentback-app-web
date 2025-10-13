// lib/config.ts
/**
 * Centralized, typed feature flags & env access.
 * Safe on both server and client (NEXT_PUBLIC_* only).
 */

function envBool(v: string | undefined, fallback = false): boolean {
  if (v == null) return fallback;
  const s = v.trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

/**
 * When false (default), ANY demo-related UI must stay hidden.
 * We wire nav/demo surfaces behind this, so prod never shows them by accident.
 */
export const SHOW_DEMO = envBool(process.env.NEXT_PUBLIC_SHOW_DEMO, false);
