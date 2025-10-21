// components/landlord/NewInvoiceForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  tenant_id: string;
  number?: string;
  description?: string;
  total_amount: string; // keep as string in the UI
  currency: string;
  due_date: string; // yyyy-mm-dd
};

export default function NewInvoiceForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    tenant_id: "",
    number: "",
    description: "",
    total_amount: "",
    currency: "PKR",
    due_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const totalNum = Number(form.total_amount);
      if (!form.tenant_id.trim()) throw new Error("Tenant ID is required");
      if (!form.due_date) throw new Error("Due date is required");
      if (!Number.isFinite(totalNum) || totalNum <= 0) throw new Error("Total amount must be > 0");

      const res = await fetch("/api/landlord/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: form.tenant_id.trim(),
          number: form.number?.trim() || null,
          description: form.description?.trim() || null,
          total_amount: totalNum,
          currency: form.currency || "PKR",
          due_date: form.due_date, // yyyy-mm-dd
        }),
      });

      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) {
        throw new Error(json.error || "Failed to create invoice");
      }

      router.push(`/landlord/invoices/${json.id}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-lg border p-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Tenant ID (UUID)</label>
          <input
            name="tenant_id"
            value={form.tenant_id}
            onChange={onChange}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. 6746a57e-fafd-4718-811d-49130102795a"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Invoice number (optional)</label>
          <input
            name="number"
            value={form.number}
            onChange={onChange}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. INV-2025-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <input
            name="currency"
            value={form.currency}
            onChange={onChange}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="PKR"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Total amount</label>
          <input
            name="total_amount"
            type="number"
            step="0.01"
            min="0"
            value={form.total_amount}
            onChange={onChange}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="25000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due date</label>
          <input
            name="due_date"
            type="date"
            value={form.due_date}
            onChange={onChange}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={3}
            placeholder="e.g. October rent"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create invoice"}
        </button>
        <a href="/landlord/invoices" className="text-sm text-blue-600 hover:underline">
          Cancel
        </a>
      </div>
    </form>
  );
}
