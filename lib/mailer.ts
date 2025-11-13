// lib/mailer.ts
// Minimal mailer using Resend HTTP API via fetch.
// No external deps. If RESEND_API_KEY is missing, it no-ops safely.

type EmailAttachment = {
  filename: string;
  content: string; // base64 string
  path?: undefined;
  contentType?: string;
};

type SendParams = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  from?: string; // optional override
};

export async function sendEmail(params: SendParams) {
  const apiKey = process.env.RESEND_API_KEY || "";
  const fromEnv = process.env.EMAIL_FROM || "RentBack <no-reply@rentback.app>";
  const from = params.from || fromEnv;

  // If no key configured, skip cleanly.
  if (!apiKey) {
    return { ok: false as const, skipped: true as const, reason: "no_api_key" };
  }

  // Resend API expects { from, to, subject, html/text, attachments[] }
  const body: any = {
    from,
    to: params.to,
    subject: params.subject,
  };
  if (params.html) body.html = params.html;
  if (!params.html && params.text) body.text = params.text;
  if (params.attachments?.length) body.attachments = params.attachments;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    return { ok: false as const, skipped: false as const, status: resp.status, error: txt };
  }
  return { ok: true as const };
}
