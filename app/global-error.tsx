'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-dvh flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border p-6 space-y-4">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-gray-600">
            An unexpected error occurred. If this persists, please try again later.
          </p>
          <div className="text-xs text-gray-500">
            {error?.digest ? <>Error ID: {error.digest}</> : null}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => reset()}
              className="rounded-xl px-4 py-2 border shadow-sm"
            >
              Try again
            </button>
            <a href="/" className="rounded-xl px-4 py-2 border shadow-sm">
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
