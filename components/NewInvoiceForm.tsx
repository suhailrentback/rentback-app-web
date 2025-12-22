// components/NewInvoiceForm.tsx
"use client";

import { useMemo, useState, FormEvent } from "react";
import Link from "next/link";

type Props = {
  action: (formData: FormData) => Promise<any>;
};

type Item = {
  id: string;
  description: string;
  qty: number | "";
  unit: string; // display currency major unit (e.g., "29.99")
};

function toCents(major: string | number): number {
  const n = typeof major === "number" ? major : Number(major.toString().replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export default function NewInvoiceForm({ action }: Props) {
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), description: "", qty: 1, unit: "" },
  ]);

  const [intent, setIntent] = useState<"draft" | "issue">("draft");
  const [currency, setCurrency] = useState("USD");

  const totalMajor = useMemo(() => {
    const cents = items.reduce((sum, it) => {
      const qty = Number(it.qty) || 0;
      const unitCents = toCents(it.unit);
      return sum + qty * unitCents;
    }, 0);
    return (cents / 100).toFixed(2);
  }, [items]);

  function addRow() {
    setItems((arr) => [...arr, { id: crypto.randomUUID(), description: "", qty: 1, unit: "" }]);
  }

  function removeRow(id: string) {
    setItems((arr) => (arr.length <= 1 ? arr : arr.filter((i) => i.id !== id)));
  }

  function updateRow(
    id: string,
    patch: Partial<Pick<Item, "description" | "qty" | "unit">>
  ) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Before the server action runs, serialize our item rows to cents
    const form = e.currentTarget;
    const hidden = form.querySelector<HTMLInputElement>('input[name="items"]');
    if (hidden) {
      const compact = items.map((it) => ({
        description: (it.description || "").trim(),
        qty: Number(it.qty) || 0,
        unit_price: toCents(it.unit), // cents
      }));
      hidden.value = JSON.stringify(compact);
    }
    // allow native submit to continue (server action)
  }

  return (
    <form
      action={action}
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-black/10 dark:border-white/10 p-6"
    >
      {/* Hidden fields used by the server action */}
      <input type="hidden" name="items" value="[]" />
      <input type="hidden" name="intent" value={intent} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="text-sm grid gap-1">
          <span className="opacity-70">Invoice Number (optional)</span>
          <input
            name="number"
            placeholder="INV-1007"
            className="rounded-xl px-3 py-2 border bg-transparent"
          />
        </label>

        <label className="text-sm grid gap-1">
          <span className="opacity-70">Due date (optional)</span>
          <input
            name="due_at"
            type="date"
            className="rounded-xl px-3 py-2 border bg-transparent"
          />
        </label>

        <label className="text-sm grid gap-1">
          <span className="opacity-70">Currency</span>
          <select
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-xl px-3 py-2 border bg-transparent"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="PLN">PLN</option>
            <option value="PKR">PKR</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 text-xs px-3 py-2 bg-black/5 dark:bg-white/10">
          <div className="col-span-7">Description</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit ({currency})</div>
          <div className="col-span-1 text-right">—</div>
        </div>

        <div className="divide-y divide-black/5 dark:divide-white/10">
          {items.map((it) => (
            <div key={it.id} className="grid grid-cols-12 items-center px-3 py-3 gap-3">
              <input
                placeholder="e.g., Monthly rent"
                value={it.description}
                onChange={(e) => updateRow(it.id, { description: e.target.value })}
                className="col-span-7 rounded-lg px-3 py-2 border bg-transparent"
              />
              <input
                type="number"
                min={1}
                step={1}
                value={it.qty}
                onChange={(e) =>
                  updateRow(it.id, { qty: e.target.value === "" ? "" : Number(e.target.value) })
                }
                className="col-span-2 rounded-lg px-3 py-2 border bg-transparent text-right"
              />
              <input
                placeholder="0.00"
                inputMode="decimal"
                value={it.unit}
                onChange={(e) => updateRow(it.id, { unit: e.target.value })}
                className="col-span-2 rounded-lg px-3 py-2 border bg-transparent text-right"
              />
              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => removeRow(it.id)}
                  className="text-xs rounded-lg px-2 py-1 border hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Remove row"
                  title="Remove row"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={addRow}
            className="text-xs rounded-lg px-3 py-1.5 border hover:bg-black/5 dark:hover:bg-white/10"
          >
            + Add item
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="opacity-70 text-sm">
          Subtotal / Total: <span className="font-medium">{currency} {totalMajor}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
          >
            Cancel
          </Link>
          <button
            type="submit"
            onClick={() => setIntent("draft")}
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
          >
            Save Draft
          </button>
          <button
            type="submit"
            onClick={() => setIntent("issue")}
            className="rounded-xl px-3 py-1.5 border text-xs bg-emerald-600/90 text-white hover:bg-emerald-600"
          >
            Issue Invoice
          </button>
        </div>
      </div>
    </form>
  );
}
