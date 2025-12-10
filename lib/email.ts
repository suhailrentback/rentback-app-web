// lib/email.ts
export type MailResult = { ok: true } | { ok: false; reason: string };

function isConfigured() {
  return !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailResult> {
  try {
    if (!isConfigured()) return { ok: false, reason: "no_email_keys" };
    if (!opts.to || !opts.to.includes("@")) return { ok: false, reason: "bad_to" };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html || `<pre>${escapeHtml(opts.text)}</pre>`,
      }),
    });

    if (!resp.ok) {
      const detail = await safeText(resp);
      return { ok: false, reason: `resend_${resp.status}_${detail}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: String(e?.message || e || "unknown") };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function safeText(r: Response) {
  try { return await r.text(); } catch { return ""; }
}
