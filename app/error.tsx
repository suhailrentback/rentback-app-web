'use client';

import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Helpful in Vercel logs
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <div
        className="rounded-lg border p-4 bg-red-50 text-red-800"
        role="alert"
        aria-live="assertive"
      >
        <div className="font-mono text-xs break-all">{error.message}</div>
        {error.digest && (
          <div className="font-mono text-xs opacity-70">digest: {error.digest}</div>
        )}
      </div>
      <button onClick={() => reset()} className="rounded-lg border px-3 py-1">
        Try again
      </button>
    </div>
  );
}
