// lib/email.ts
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = process.env.EMAIL_FROM || "RentBack <no-reply@rentback.app>";
  const key = process.env.RESEND_API_KEY; // optional
  if (!key) {
    return { ok: false as const, skipped: true as const, reason: "no_key" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text || "",
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false as const, skipped: false as const, reason: detail || res.statusText };
  }
  return { ok: true as const };
}
