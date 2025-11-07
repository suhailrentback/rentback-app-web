// app/landlord/invoices/[id]/edit/EditInvoiceForm.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Initial = {
  id: string;
  number: string;
  description: string;
  status: string;
  total_amount: number;
  currency: string;
  issued_at: string | null;
  due_date: string | null;
};

const STATUS = ["open", "issued", "paid", "overdue", "void"] as const;

export default function EditInvoiceForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [number, setNumber] = useState(initial.number);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState(initial.status);
  const [totalAmount, setTotalAmount] = useState<number>(initial.total_amount);
  const [currency, setCurrency] = useState(initial.currency);
  const [issuedAt, setIssuedAt] = useState(
    initial.issued_at ? initial.issued_at.slice(0, 10) : ""
  );
  const [dueDate, setDueDate] = useState(
    initial.due_date ? initial.due_date.slice(0, 10) : ""
  );

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(false);

    try {
      const payload = {
        number: number || null,
        description: description || null,
        status: status || null,
        total_amount:
          typeof totalAmount === "number"
            ? totalAmount
            : Number(totalAmount) || 0,
        currency: currency || null,
        issued_at: issuedAt ? new Date(issuedAt).toISOString() : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };

      const res = await fetch(`/api/landlord/invoices/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || "update_failed");
      } else {
        setOk(true);
        // Refresh page data and go back to the show list for a better flow
        router.replace("/landlord/invoices");
        router.refresh();
      }
    } catch (e) {
      setErr("network_error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div>
        <label className="mb-1 block text-xs text-gray-500">Invoice #</label>
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="INV-000123"
          maxLength={64}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">Description</label>
        <input
          className="w-full rounded-xl border px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="September rent"
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Amount</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={Number.isFinite(totalAmount) ? totalAmount : 0}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Currency</label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="PKR / USD"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Issued date</label>
          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Due date</label>
          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <a
          href="/landlord/invoices"
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </a>
        <div className="ml-auto text-xs">
          {ok && <span className="text-green-600">Saved.</span>}
          {err && <span className="text-red-600">Error: {err}</span>}
        </div>
      </div>
    </form>
  );
}
