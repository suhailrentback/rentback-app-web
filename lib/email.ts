// lib/email.ts
export type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const PROVIDER = process.env.EMAIL_PROVIDER ?? "none";
/**
 * Tiny, dependency-free email stub.
 * - If EMAIL_PROVIDER is not set (or "none"), we just log and return ok.
 * - Swap this later for Resend/SMTP etc. without touching callers.
 */
export async function sendEmail(args: SendArgs) {
  if (!PROVIDER || PROVIDER === "none") {
    console.log("[email:noop]", { to: args.to, subject: args.subject });
    return { ok: true, skipped: true as const, provider: "none" };
  }
  // Placeholder “real” send — integrate later.
  console.log("[email:send]", { provider: PROVIDER, to: args.to, subject: args.subject });
  return { ok: true, provider: PROVIDER };
}
