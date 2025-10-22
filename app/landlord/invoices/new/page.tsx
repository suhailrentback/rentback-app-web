"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function NewInvoicePage() {
  const router = useRouter();
  const [tenantEmail, setTenantEmail] = useState("");
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [currency, setCurrency] = useState("PKR");
  const [dueDate, setDueDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => {
    if (!tenantEmail.trim()) return false;
    const amt = Number(totalAmount);
    if (!Number.isFinite(amt) || amt <= 0) return false;
    if (!dueDate) return false;
    return true;
  }, [tenantEmail, totalAmount, dueDate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        tenant_email: tenantEmail.trim(),
        number: number.trim() || null,
        description: description.trim() || null,
        total_amount: Number(totalAmount),
        currency: currency.trim() || "PKR",
        issued_at: new Date().toISOString(),
        // convert YYYY-MM-DD -> ISO (midnight UTC)
        due_date: new Date(`${dueDate}T00:00:00Z`).toISOString(),
      };

      const res = await fetch("/api/landlord/invoices/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed (${res.status})`);
      }

      // success -> back to landlord home (can change later)
      router.push("/landlord");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
        <p className="text-sm text-gray-600">
          Issue an invoice to a tenant. Amount is in whole currency (e.g. 25000 PKR).
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Tenant email</label>
          <input
            type="email"
            required
            value={tenantEmail}
            onChange={(e) => setTenantEmail(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="tenant@example.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="PKR"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Due date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Invoice # (optional)</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="INV-2025-001"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="October rent"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create invoice"}
          </button>
          <button
            type="button"
            onClick={() => history.back()}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );]]

  // ...
if (!res.ok) {
  const j = await res.json().catch(() => ({}));
  throw new Error(j?.error || `Request failed (${res.status})`);
}

// success -> back to landlord with success flag
router.push("/landlord?created=1");
router.refresh();
// ...
}
