"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // surface in logs
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-600">We’ve logged the error (digest: {error?.digest ?? "n/a"}).</p>
      <button
        className="px-4 py-2 rounded-md bg-black text-white hover:opacity-90"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
