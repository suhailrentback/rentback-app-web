// lib/email.ts

export type SendEmailArgs = {
  to: string;
  subject: string;
  html?: string;   // now optional
  text?: string;   // optional too; we’ll derive one if needed
};

function textToHtml(t?: string): string {
  if (!t) return "<p></p>";
  // very light escaping + newline → <br>
  const escaped = t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return escaped.replace(/\r?\n/g, "<br>");
}

function htmlToText(h?: string): string {
  if (!h) return "";
  return h
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * sendEmail — provider-agnostic helper.
 * - No-op if no provider key found (keeps builds green in all envs).
 * - Supports RESEND out of the box if RESEND_API_KEY is present.
 * - Falls back to console.log in non-production without keys.
 *
 * Required env (if using a provider):
 * - RESEND_API_KEY (optional; if set, we’ll use Resend)
 * - EMAIL_FROM (e.g., "RentBack <no-reply@rentback.app>")
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailArgs): Promise<void> {
  if (!to) return;
  const hasResend = !!process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "RentBack <no-reply@rentback.app>";

  const bodyHtml = html ?? textToHtml(text);
  const bodyText = text ?? htmlToText(html);

  // No provider: no-op (log in dev)
  if (!hasResend) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[sendEmail noop]", { to, subject, bodyText });
    }
    return;
  }

  // Resend
  try {
    // Next.js runtime has fetch available
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: bodyHtml,
        text: bodyText || undefined,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[sendEmail resend error]", res.status, detail);
    }
  } catch (err) {
    console.error("[sendEmail exception]", err);
  }
}

// Also export default for flexible importing styles
export default sendEmail;
