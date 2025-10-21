// app/landlord/invoices/new/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewInvoicePage() {
  const [tenantEmail, setTenantEmail] = useState("");
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState<string>("");
  const [currency, setCurrency] = useState("PKR");
  const [due, setDue] = useState<string>(""); // yyyy-mm-dd
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; id?: string; number?: string; error?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/landlord/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_email: tenantEmail,
          description,
          total_amount: Number(total),
          currency,
          due_date: due ? new Date(due).toISOString() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResult({ error: json?.error ? String(json.error) : "Failed to create invoice" });
      } else {
        setResult(json);
        // clear form
        setTenantEmail("");
        setDescription("");
        setTotal("");
        setCurrency("PKR");
        setDue("");
      }
    } catch (err: any) {
      setResult({ error: err?.message ?? "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <Link href="/landlord" className="text-sm text-gray-600 hover:underline">
          ← Back to landlord dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">Create invoice</h1>
      <p className="mt-1 text-sm text-gray-600">Issue an invoice to a tenant by email.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium">Tenant email</label>
          <input
            type="email"
            required
            value={tenantEmail}
            onChange={(e) => setTenantEmail(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="tenant@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="October rent"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium">Total amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="25000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Currency</label>
            <input
              type="text"
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-md border px-3 py-2 uppercase"
              placeholder="PKR"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Due date</label>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-500">Leave empty to default to +14 days.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create invoice"}
          </button>
          <Link href="/landlord" className="rounded-md border px-4 py-2 hover:bg-gray-50">
            Cancel
          </Link>
        </div>

        {result?.error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {result.error}
          </div>
        )}
        {result?.ok && (
          <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
            Invoice <span className="font-mono">{result.number}</span> created.
            Tenants will see it in their dashboard.
          </div>
        )}
      </form>
    </div>
  );
}
