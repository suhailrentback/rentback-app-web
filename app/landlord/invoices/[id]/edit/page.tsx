// app/landlord/invoices/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";

type InvoiceRow = {
  id: string;
  number: string | null;
  description: string | null;
  status: "open" | "issued" | "paid" | "overdue" | "void";
  currency: string | null;
  total_amount: number | null;
  due_date: string | null; // ISO string from DB
};

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createRouteSupabase();
  const { id } = params;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, number, description, status, currency, total_amount, due_date")
    .eq("id", id)
    .maybeSingle<InvoiceRow>();

  if (error || !invoice) {
    notFound();
  }

  // Pre-fill UI values
  const amountStr =
    typeof invoice.total_amount === "number"
      ? String(invoice.total_amount)
      : "";
  const currencyStr = (invoice.currency || "PKR").toUpperCase();
  const dueDateStr = invoice.due_date
    ? new Date(invoice.due_date).toISOString().slice(0, 10)
    : "";

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/landlord/invoices" className="text-sm text-blue-600 hover:underline">
          ← Back to invoices
        </Link>
        <Link href="/sign-out" className="text-xs text-gray-500 hover:underline">
          Sign out
        </Link>
      </div>

      <h1 className="text-xl font-semibold">
        Edit invoice {invoice.number ? `#${invoice.number}` : ""}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Update amount, status, due date, or description.
      </p>

      {/* Client form */}
      <div className="mt-6 rounded-2xl border p-4">
        <EditInvoiceForm
          id={invoice.id}
          initialAmount={amountStr}
          initialCurrency={currencyStr}
          initialStatus={invoice.status}
          initialDueDate={dueDateStr}
          initialDescription={invoice.description || ""}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceRow["status"] }) {
  const map: Record<InvoiceRow["status"], string> = {
    open: "bg-yellow-50 text-yellow-800 border-yellow-200",
    issued: "bg-blue-50 text-blue-800 border-blue-200",
    paid: "bg-green-50 text-green-800 border-green-200",
    overdue: "bg-red-50 text-red-800 border-red-200",
    void: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${map[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

// ---------- Client Form ----------
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function EditInvoiceForm(props: {
  id: string;
  initialAmount: string;
  initialCurrency: string;
  initialStatus: InvoiceRow["status"];
  initialDueDate: string;
  initialDescription: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(props.initialAmount);
  const [currency, setCurrency] = useState(props.initialCurrency);
  const [status, setStatus] = useState<InvoiceRow["status"]>(props.initialStatus);
  const [dueDate, setDueDate] = useState(props.initialDueDate);
  const [description, setDescription] = useState(props.initialDescription);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { t: "ok" | "err"; m: string }>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/landlord/invoices/${props.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          status,
          due_date: dueDate || null,
          description: description || null,
        }),
      });
      if (!res.ok) {
        setMsg({ t: "err", m: "Update failed" });
      } else {
        setMsg({ t: "ok", m: "Saved" });
        router.push("/landlord/invoices");
      }
    } catch {
      setMsg({ t: "err", m: "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Amount</label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min={0}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Currency</label>
          <input
            type="text"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={6}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <div className="flex items-center gap-2">
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="open">Open</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="void">Void</option>
            </select>
            <StatusBadge status={status} />
          </div>
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

      <div>
        <label className="mb-1 block text-xs text-gray-500">Description</label>
        <textarea
          className="w-full rounded-xl border px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="h-5 text-sm">
          {msg?.t === "ok" && <span className="text-green-700">Saved</span>}
          {msg?.t === "err" && <span className="text-red-600">{msg.m}</span>}
        </div>
        <div className="flex gap-2">
          <Link
            href="/landlord/invoices"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
