'use client';

import { useState } from 'react';
import Link from 'next/link';

type PostBody = {
  tenant_email: string;
  description: string;
  amount: number; // PKR (e.g., 25000)
  due_date: string; // YYYY-MM-DD
};

export default function NewInvoicePage() {
  const [form, setForm] = useState<PostBody>({
    tenant_email: '',
    description: '',
    amount: 0,
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; id?: string; number?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/landlord/invoices/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data?.error ?? 'Failed to create invoice.' });
      } else {
        setResult({ ok: true, message: 'Invoice created.', id: data?.id, number: data?.number });
      }
    } catch (err) {
      setResult({ ok: false, message: 'Network error.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="mb-4">
        <Link href="/landlord" className="text-sm underline">← Back to landlord dashboard</Link>
      </div>

      <h1 className="text-2xl font-semibold mb-2">Create Invoice</h1>
      <p className="text-sm text-gray-500 mb-6">Issue a rent invoice to a tenant by email.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Tenant email</label>
          <input
            className="w-full rounded-xl border p-2"
            type="email"
            placeholder="tenant@example.com"
            value={form.tenant_email}
            onChange={(e) => setForm({ ...form, tenant_email: e.target.value.trim() })}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <input
            className="w-full rounded-xl border p-2"
            type="text"
            placeholder="October rent"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Amount (PKR)</label>
            <input
              className="w-full rounded-xl border p-2"
              type="number"
              min={0}
              step="1"
              placeholder="25000"
              value={Number.isNaN(form.amount) ? '' : form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Due date</label>
            <input
              className="w-full rounded-xl border p-2"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl px-4 py-2 border shadow-sm disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create invoice'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 rounded-xl border p-4 ${result.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm">{result.message}</p>
          {result.ok && (
            <div className="mt-2 text-sm">
              {result.number ? <p>Invoice #: {result.number}</p> : null}
              {result.id ? (
                <p className="mt-1">
                  Tenant can view it under{' '}
                  <Link href={`/tenant/invoices/${result.id}`} className="underline">
                    their invoice detail
                  </Link>
                  .
                </p>
              ) : null}
              <div className="mt-3 space-x-3">
                <Link href="/landlord" className="underline">Go to landlord dashboard</Link>
                <Link href="/tenant/invoices" className="underline">Open tenant invoices</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
