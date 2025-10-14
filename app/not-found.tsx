export default function NotFound() {
  return (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">404 — Not found</h1>
      <p className="opacity-80">The page you requested doesn’t exist.</p>
      <a href="/" className="inline-block rounded-lg border px-3 py-1 mt-2">
        Go home
      </a>
    </div>
  );
}
