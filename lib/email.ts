// lib/email.ts
export type SendEmailOpts = {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    contentBase64: string;
  }>;
  fromOverride?: string;
};

/**
 * Sends an email via Resend API if RESEND_API_KEY is set.
 * Otherwise, safe no-op (returns { ok: false, reason: "noop" }).
 */
export async function sendEmailResend(opts: SendEmailOpts) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromDefault = process.env.RESEND_FROM || "RentBack <no-reply@rentback.app>";

  if (!apiKey) {
    // no-op in environments without email credentials
    return { ok: false as const, reason: "noop" };
  }

  const payload: any = {
    from: opts.fromOverride || fromDefault,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
  };

  if (opts.attachments?.length) {
    payload.attachments = opts.attachments.map(a => ({
      filename: a.filename,
      content: a.contentBase64,
      content_type: a.contentType,
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false as const, reason: `resend_failed: ${res.status} ${text}` };
  }
  return { ok: true as const };
}
