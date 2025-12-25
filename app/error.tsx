'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep this; helps us debug without exposing details to users
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-semibold">We hit a snag</h1>
        <p className="text-sm text-gray-600">
          Please retry. If this keeps happening, contact support.
        </p>
        <div className="text-xs text-gray-500">
          {error?.digest ? <>Error ID: {error.digest}</> : null}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="rounded-xl px-4 py-2 border shadow-sm"
          >
            Retry
          </button>
          <a href="/" className="rounded-xl px-4 py-2 border shadow-sm">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
