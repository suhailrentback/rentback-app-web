"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  number?: string | null;
  status?: string | null;
  issued_at?: string | null;
  due_date?: string | null;
  amount_cents?: number | null;
  total_amount?: number | null;
  currency?: string | null;
  description?: string | null;
};

export default function InvoiceDetailClient({ id }: { id: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/tenant/invoices/${id}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Invoice;
        if (alive) setInvoice(json);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load invoice");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading invoice…</div>;
  }
  if (err) {
    return (
      <div className="text-sm text-red-600">
        Couldn’t load invoice. {err}
      </div>
    );
  }
  if (!invoice) {
    return <div className="text-sm text-gray-500">Invoice not found.</div>;
  }

  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  const total =
    typeof invoice.total_amount === "number"
      ? invoice.total_amount
      : typeof invoice.amount_cents === "number"
      ? invoice.amount_cents / 100
      : 0;

  const invoiceUrl = `/api/tenant/invoices/${invoice.id}/pdf`;
  const receiptUrl = `/api/tenant/invoices/${invoice.id}/receipt`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Invoice {invoice.number ?? `#${invoice.id.slice(0, 6)}`}
        </h1>
        <p className="text-sm text-gray-500">
          {invoice.description ?? "—"} · {String(invoice.status ?? "").toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <a href={invoiceUrl} className="px-4 py-2 rounded bg-gray-900 text-white text-sm">
          Download invoice (PDF)
        </a>
        <a
          href={receiptUrl}
          className={`px-4 py-2 rounded text-sm ${
            isPaid ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          aria-disabled={!isPaid}
          onClick={(e) => {
            if (!isPaid) e.preventDefault();
          }}
        >
          Download receipt (PDF)
        </a>
      </div>

      <div className="text-sm text-gray-700">
        <div>
          Total: {total} {invoice.currency ?? "PKR"}
        </div>
        <div>
          Issued: {invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"}
        </div>
        <div>
          Due: {invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}
        </div>
      </div>
    </div>
  );
}
