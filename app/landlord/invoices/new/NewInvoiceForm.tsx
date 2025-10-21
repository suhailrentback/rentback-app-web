"use client";

import { useState } from "react";

type Resp =
  | { id: string; number?: string | null; tenant_invoice_url: string }
  | { error: string };

export default function NewInvoiceForm() {
  const [tenantEmail, setTenantEmail] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("PKR");
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [number, setNumber] = useState<string>(""); // optional human ref like INV-123
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Resp | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/landlord/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_email: tenantEmail,
          amount,
          currency,
          due_date: dueDate,
          description,
          number: number || undefined,
        }),
      });
      const data = (await res.json()) as Resp;
      setResult(data);
    } catch (err) {
      setResult({ error: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border rounded p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          <span className="block mb-1">Tenant email</span>
          <input
            type="email"
            required
            value={tenantEmail}
            onChange={(e) => setTenantEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="tenant@example.com"
          />
        </label>

        <label className="block text-sm">
          <span className="block mb-1">Amount</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="25000"
          />
        </label>

        <label className="block text-sm">
          <span className="block mb-1">Currency</span>
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className="w-full border rounded px-3 py-2"
            placeholder="PKR"
          />
        </label>

        <label className="block text-sm">
          <span className="block mb-1">Due date</span>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="block mb-1">Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="October rent"
        />
      </label>

      <label className="block text-sm">
        <span className="block mb-1">
          Invoice number (optional, e.g., INV-001234)
        </span>
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="INV-001234"
        />
      </label>

      <div className="flex gap-2">
        <button
          disabled={submitting}
          type="submit"
          className="border rounded px-4 py-2"
        >
          {submitting ? "Creating…" : "Create invoice"}
        </button>
      </div>

      {result && "error" in result && (
        <p className="text-sm text-red-600">Error: {result.error}</p>
      )}
      {result && "id" in result && (
        <div className="text-sm text-green-700 space-y-1">
          <div>
            Created invoice{" "}
            <span className="font-medium">
              {result.number ?? result.id.slice(0, 8)}
            </span>
            .
          </div>
          <div className="text-gray-700">
            Share this link with the tenant:{" "}
            <a
              className="underline"
              href={result.tenant_invoice_url}
              target="_blank"
              rel="noreferrer"
            >
              {result.tenant_invoice_url}
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
