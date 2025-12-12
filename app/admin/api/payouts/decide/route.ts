// app/admin/api/payouts/decide/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function getActor(sb: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await (await sb).auth.getUser();
  if (!user) return { ok: false as const, reason: "not_authenticated" };

  const { data: prof } = await (await sb)
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  const role = (prof?.role || "").toLowerCase();
  const isStaff = role === "staff" || role === "admin";
  if (!isStaff) return { ok: false as const, reason: "forbidden" };

  return { ok: true as const, user, prof };
}

function back(ok?: string, err?: string) {
  const url = new globalThis.URL("/admin/payouts", process.env.SITE_URL);
  if (ok) url.searchParams.set("ok", ok);
  if (err) url.searchParams.set("err", err);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id = String(form.get("id") || "");
    const action = String(form.get("action") || "").toLowerCase(); // "approve" | "deny"
    const note = String(form.get("note") || "").slice(0, 2000);

    if (!id || (action !== "approve" && action !== "deny")) {
      return back(undefined, "invalid_input");
    }

    const sb = createClient(cookies());
    const guard = await getActor(sb);
    if (!guard.ok) return back(undefined, guard.reason);

    const decided_status = action === "approve" ? "APPROVED" : "DENIED";
    const decided_by = guard.user.id;

    // Update payout request row
    const { error: upErr } = await (await sb)
      .from("payout_requests")
      .update({
        status: decided_status,
        decided_at: new Date().toISOString(),
        decided_by,
        note: note || null,
      })
      .eq("id", id);

    if (upErr) return back(undefined, upErr.message.slice(0, 120));

    // Optional: email (no-op if you don't have a sender configured)
    try {
      // If you have a sendEmail helper, import it and send an HTML+text message.
      // Example (commented to avoid missing import/type errors):
      //
      // import { sendEmail } from "@/lib/email";
      // const subject = `Payout ${decided_status}`;
      // const html = `<p>Your payout request <b>${id}</b> is <b>${decided_status}</b>.</p>${note ? `<p>Note: ${note}</p>` : ""}`;
      // await sendEmail({ to: guard.prof?.email || "", subject, html, text: html.replace(/<[^>]+>/g, "") });
    } catch {
      // swallow email errors
    }

    return back(`Payout ${decided_status}`);
  } catch (e: any) {
    return back(undefined, (e?.message || "unknown_error").slice(0, 120));
  }
}
