"use client";

import { useState } from "react";
import Link from "next/link";

type ApiError = {
  error?: string;
  detail?: string;
  issues?: Array<{ path?: string[]; message?: string }>;
};

function friendlyMessage(json: ApiError): string {
  const raw = (json.detail || json.error || "").toLowerCase();

  if (/duplicate key value/i.test(raw) && /invoices.*number/i.test(raw)) {
    return "Invoice number already exists. Pick a different number.";
  }
  if (/row level security/i.test(raw)) {
    return "Insert blocked by RLS. Run the policies SQL I provided.";
  }
  if (/invalid input syntax/i.test(raw) && /uuid/i.test(raw)) {
    return "Invalid tenant id/email mapping. Make sure the tenant email exists and is verified.";
  }
  if (json.error === "tenant_not_found") {
    return "Tenant not found for that email.";
  }
  if (json.error === "invalid_payload") {
    const first = json.issues?.[0]?.message;
    return first ? `Invalid field: ${first}` : "Invalid payload — please check fields.";
  }
  return json.detail || json.error || "Failed to create invoice.";
}

export default function CreateInvoicePage() {
  const [tenantEmail, setTenantEmail] = useState("");
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/landlord/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantEmail,
          number,
          description,
          currency,
          total_amount: totalAmount, // server coerces to number
          due_date: dueDate,        // YYYY-MM-DD
        }),
      });

      const json: ApiError = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(friendlyMessage(json));
        return;
      }

      setStatus("ok");
      // Optional: redirect
      // window.location.href = "/landlord";
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-4">
        <Link href="/landlord" className="text-sm underline">
          ← Back to landlord dashboard
        </Link>
      </div>

      <h1 className="text-xl font-semibold">Create Invoice</h1>
      <p className="mb-6 text-sm text-gray-600">Issue an invoice to a tenant by email.</p>

      {status === "ok" ? (
        <div className="rounded-xl border p-4 text-sm">
          <div className="mb-2 font-medium">Created ✅</div>
          <div>You can issue another invoice or go back to the dashboard.</div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setTenantEmail("");
                setNumber("");
                setDescription("");
                setCurrency("PKR");
                setTotalAmount("");
                setDueDate("");
                setStatus("idle");
                setErrorMsg("");
              }}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              Create another
            </button>
            <Link href="/landlord" className="rounded-xl border px-3 py-2 text-sm">
              Go to dashboard
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {status === "error" && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {errorMsg || "Something went wrong."}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm">Tenant email</label>
            <input
              type="email"
              required
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="suhail@rentback.app"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Invoice number</label>
            <input
              type="text"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="INV-2025-001"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="November rent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm">Currency (3-letter)</label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="PKR"
                maxLength={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Amount (e.g., 25000)</label>
              <input
                type="number"
                inputMode="decimal"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="25000"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm">Due date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {status === "submitting" ? "Creating…" : "Create invoice"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
