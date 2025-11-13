"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InvoiceRow = {
  id: string;
  number: string | null;
  description: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: "draft"|"issued"|"open"|"paid"|"overdue"|"void";
  due_date: string | null;
};

const ALLOWED = ["draft","issued","open","paid","overdue","void"] as const;

export default function EditInvoiceForm({ invoice }: { invoice: InvoiceRow }) {
  const router = useRouter();
  const [number, setNumber] = useState(invoice.number ?? "");
  const [desc, setDesc] = useState(invoice.description ?? "");
  const [amount, setAmount] = useState(
    typeof invoice.amount_cents === "number" ? (invoice.amount_cents / 100).toString() : "0"
  );
  const [currency, setCurrency] = useState(invoice.currency ?? "PKR");
  const [status, setStatus] = useState<InvoiceRow["status"]>(invoice.status || "open");
  const [due, setDue] = useState(invoice.due_date ? invoice.due_date.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/landlord/api/invoices/${invoice.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: number || null,
          description: desc || null,
          amount: amount ? Number(amount) : null,   // major units
          currency: currency || null,
          status,
          due_date: due || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j?.error ? `Error: ${j.error}` : "Update failed");
      } else {
        setMsg("Saved");
        router.refresh();
      }
    } catch (err: any) {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
      {msg && <div className="rounded-xl border px-3 py-2 text-sm">{msg}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm">Invoice number</span>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="INV-2025-001"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Status</span>
          <select
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as InvoiceRow["status"])}
          >
            {ALLOWED.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25000.00"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Currency</span>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="PKR"
          />
        </label>

        <label className="md:col-span-2 block">
          <span className="mb-1 block text-sm">Description</span>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="October rent"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Due date</span>
          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
