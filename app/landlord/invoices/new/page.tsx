// app/landlord/invoices/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FieldErrors = Partial<Record<
  "tenantEmail" | "amount" | "currency" | "dueDate" | "description",
  string[]
>>;

export default function NewInvoicePage() {
  const router = useRouter();
  const [tenantEmail, setTenantEmail] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("PKR");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/landlord/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantEmail,
          amount,       // server coerces to number
          currency,     // server uppercases & validates 3-letter
          dueDate,      // must be YYYY-MM-DD
          description,
        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        // Show field-level validation errors when available
        if (json?.fieldErrors) setFieldErrors(json.fieldErrors);
        setFormError(json?.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      // Success → go back to landlord invoices list
      router.push("/landlord/invoices");
    } catch (err) {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create Invoice</h1>
        <a
          href="/landlord/invoices"
          className="text-sm underline hover:opacity-80"
        >
          Back to invoices
        </a>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Tenant email */}
        <div>
          <label className="mb-1 block text-sm font-medium">Tenant email</label>
          <input
            type="email"
            inputMode="email"
            required
            value={tenantEmail}
            onChange={(e) => setTenantEmail(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="suhail@rentback.app"
            aria-invalid={!!fieldErrors.tenantEmail?.length}
          />
          {fieldErrors.tenantEmail?.length ? (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.tenantEmail[0]}
            </p>
          ) : null}
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1 block text-sm font-medium">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="25000"
            aria-invalid={!!fieldErrors.amount?.length}
          />
          {fieldErrors.amount?.length ? (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.amount[0]}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Digits only; decimals allowed (we’ll handle cents).
            </p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="mb-1 block text-sm font-medium">Currency</label>
          <input
            type="text"
            maxLength={3}
            required
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm uppercase"
            placeholder="PKR"
            aria-invalid={!!fieldErrors.currency?.length}
          />
          {fieldErrors.currency?.length ? (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.currency[0]}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              3-letter code (e.g., PKR, USD, EUR). Case doesn’t matter.
            </p>
          )}
        </div>

        {/* Due date */}
        <div>
          <label className="mb-1 block text-sm font-medium">Due date</label>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            aria-invalid={!!fieldErrors.dueDate?.length}
          />
          {fieldErrors.dueDate?.length ? (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.dueDate[0]}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Format: YYYY-MM-DD</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="October rent"
            aria-invalid={!!fieldErrors.description?.length}
          />
          {fieldErrors.description?.length ? (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.description[0]}
            </p>
          ) : null}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl border bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {submitting ? "Creating…" : "Create invoice"}
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-xl border p-3 text-xs text-gray-600">
        <p className="mb-1 font-semibold">Tips</p>
        <ul className="list-disc pl-5">
          <li>Make sure the tenant email already exists in Profiles.</li>
          <li>Amount must be a number (e.g., 25000 or 25000.00).</li>
          <li>Currency must be a 3-letter code (e.g., PKR).</li>
          <li>Due date must be YYYY-MM-DD.</li>
        </ul>
      </div>
    </div>
  );
}
