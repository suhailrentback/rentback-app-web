// app/admin/api/payouts/decide/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

async function requireStaff() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401, json: { error: "not_authenticated" } };

  const { data: prof, error } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", uid)
    .maybeSingle();

  if (error || !prof) {
    return { ok: false as const, status: 403, json: { error: "profile_not_found" } };
  }
  if (!["admin", "staff"].includes(String(prof.role))) {
    return { ok: false as const, status: 403, json: { error: "forbidden" } };
  }
  return { ok: true as const, supabase, uid };
}

async function readBody(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData();
    return {
      id: String(form.get("id") || ""),
      decision: String(form.get("decision") || ""),
      notes: String(form.get("notes") || ""),
      idempotency_key: String(form.get("idempotency_key") || ""),
    };
  }
  const json = await req.json().catch(() => ({}));
  return {
    id: String(json.id || ""),
    decision: String(json.decision || ""),
    notes: String(json.notes || ""),
    idempotency_key: String(json.idempotency_key || ""),
  };
}

export async function POST(req: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json(guard.json, { status: guard.status });
  const { supabase } = guard;

  const body = await readBody(req);
  const id = body.id?.trim();
  const decision = (body.decision || "").toLowerCase();
  const idem = body.idempotency_key?.trim() || null;
  const notes = body.notes?.trim() || null;

  if (!id || !["approve", "deny"].includes(decision)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (decision === "deny") {
    const { data, error } = await supabase.rpc("admin_deny_payout", {
      p_payout_id: id,
      p_reason: notes,
    });
    if (error) {
      return NextResponse.json({ error: "deny_failed", detail: error.message }, { status: 500 });
    }
    // optional: email landlord on denial (no html preferences known)
    // await sendEmail({ to, subject, html: "<p>Your payout was denied.</p>", text: "Your payout was denied." });
    const url = new globalThis.URL("/admin/payouts", process.env.SITE_URL);
    return NextResponse.redirect(url, 303);
  }

  // APPROVE: atomic finalize with idempotency
  const { data, error } = await supabase.rpc("admin_finalize_payout", {
    p_payout_id: id,
    p_idempotency_key: idem,
  });

  if (error) {
    return NextResponse.json({ error: "approve_failed", detail: error.message }, { status: 500 });
  }

  // Optional success email (HTML required by sendEmail signature)
  // In real flow you'd look up landlord email by landlord_id from payout_requests
  // and attach a payout PDF if desired. Here we keep it minimal & valid.
  try {
    await sendEmail({
      to: "ops@rentback.app",
      subject: "Payout Approved",
      html: `<p>Payout <code>${id}</code> approved.</p>`,
      text: `Payout ${id} approved.`,
    });
  } catch {
    // swallow email errors to keep UX smooth
  }

  const url = new globalThis.URL("/admin/payouts", process.env.SITE_URL);
  return NextResponse.redirect(url, 303);
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
