// components/MarkPaidButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function MarkPaidButton({
  invoiceId,
  disabled,
}: {
  invoiceId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const onClick = () => {
    setErr(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: "POST" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to mark as paid");
        }
        router.refresh();
      } catch (e: any) {
        setErr(e.message || "Something went wrong");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={onClick}
        disabled={!!disabled || pending}
        className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                   disabled:opacity-40 disabled:cursor-not-allowed
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
      >
        {pending ? "Marking…" : "Mark as Paid"}
      </button>
      {err ? <div className="text-xs text-rose-600">{err}</div> : null}
    </div>
  );
}
