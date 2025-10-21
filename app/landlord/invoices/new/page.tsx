// app/landlord/invoices/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewInvoicePage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState("PKR");
  const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState<"open" | "paid">("open");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreatedId(null);

    try {
      const res = await fetch("/api/landlord/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId.trim(),
          description: description.trim(),
          total_amount:
            typeof totalAmount === "string" ? Number(totalAmount) : totalAmount,
          currency: currency.trim() || "PKR",
          due_date: dueDate, // must be YYYY-MM-DD
          number: number.trim() || undefined,
          status,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to create invoice");
        return;
      }
      setCreatedId(json.id);
      // For now, bounce back to landlord dashboard
      router.push("/landlord");
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Create invoice</h1>
      <p className="text-sm text-gray-600 mt-1">
        Issue an invoice to a tenant (amounts in {currency}).
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Tenant ID (UUID)</label>
          <input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g. 6746a57e-fafd-4718-811d-49130102795a"
          />
          <p className="text-xs text-gray-500 mt-1">
            (We’ll add tenant lookup later.)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="October rent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Total amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) =>
                setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="25000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Currency</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="PKR"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Invoice number</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="INV-2025-001"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "open" | "paid")}
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            <option value="open">Open</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
            {error}
          </div>
        )}
        {createdId && (
          <div className="rounded-md bg-green-50 border border-green-200 text-green-700 p-3 text-sm">
            Created invoice: {createdId}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create invoice"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/landlord")}
            className="rounded-md border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
