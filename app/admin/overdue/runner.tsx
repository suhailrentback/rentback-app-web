// app/admin/overdue/runner.tsx
"use client";

import { useState } from "react";

export default function OverdueRunner() {
  const [count, setCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ updated?: number; ids?: string[]; error?: string } | null>(null);

  async function check() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/admin/api/invoices/overdue-dry-run", { cache: "no-store" });
      const j = await res.json();
      setCount(typeof j.count === "number" ? j.count : 0);
    } catch (e) {
      setResult({ error: "Failed to check." });
    } finally {
      setRunning(false);
    }
  }

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/admin/api/invoices/overdue-run", { method: "POST" });
      const j = await res.json();
      setResult(j);
      if (typeof j.updated === "number") {
        // re-check after run
        const r2 = await fetch("/admin/api/invoices/overdue-dry-run", { cache: "no-store" });
        const j2 = await r2.json();
        setCount(typeof j2.count === "number" ? j2.count : 0);
      }
    } catch (e) {
      setResult({ error: "Failed to run." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <button
          onClick={check}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={running}
        >
          Check eligible count
        </button>
        <button
          onClick={run}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={running}
        >
          Run now
        </button>
      </div>
      <div className="text-sm text-gray-700">
        Eligible to mark overdue: <strong>{count === null ? "—" : count}</strong>
      </div>
      {result?.error && (
        <div className="rounded bg-red-50 p-2 text-sm text-red-700">Error: {result.error}</div>
      )}
      {typeof result?.updated === "number" && (
        <div className="rounded bg-green-50 p-2 text-sm text-green-700">
          Updated invoices: <strong>{result.updated}</strong>
        </div>
      )}
    </div>
  );
}
