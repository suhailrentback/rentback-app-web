"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewInvoicePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);

      const payload = {
        tenant_email: String(fd.get("tenant_email") || "").trim(),
        number: String(fd.get("number") || "").trim() || undefined,
        description: String(fd.get("description") || "").trim() || undefined,
        currency: (String(fd.get("currency") || "PKR") || "PKR").toUpperCase(),
        total_amount: Number(fd.get("total_amount") || 0),
        due_date: String(fd.get("due_date") || "").trim() || undefined,
      };

      const res = await fetch("/api/landlord/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j?.error || `Request failed (${res.status})`);
      }

      // Success → back to landlord home with success flag
      router.push("/landlord?created=1");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create invoice</h1>
        <Link href="/landlord" className="text-sm text-gray-600 hover:underline">
          ← Back
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="tenant_email" className="block text-sm font-medium">
            Tenant email
          </label>
          <input
            id="tenant_email"
            name="tenant_email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="tenant@example.com"
          />
          <p className="text-xs text-gray-500">
            We’ll look up the tenant by email.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="total_amount" className="block text-sm font-medium">
              Amount
            </label>
            <input
              id="total_amount"
              name="total_amount"
              type="number"
              min="0"
              step="0.01"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="25000"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="currency" className="block text-sm font-medium">
              Currency
            </label>
            <input
              id="currency"
              name="currency"
              type="text"
              defaultValue="PKR"
              className="w-full rounded-md border px-3 py-2 text-sm uppercase"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="due_date" className="block text-sm font-medium">
            Due date
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="number" className="block text-sm font-medium">
            Invoice number (optional)
          </label>
          <input
            id="number"
            name="number"
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="INV-2025-001"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="October rent"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
