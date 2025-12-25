export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border p-6 space-y-4 text-center">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-gray-600">
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <a href="/" className="inline-block rounded-xl px-4 py-2 border shadow-sm mt-2">
          Go home
        </a>
      </div>
    </div>
  );
}
