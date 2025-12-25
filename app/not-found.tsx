export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-gray-600">The page you’re looking for doesn’t exist.</p>
      <a className="underline" href="/">Go home</a>
    </div>
  );
}
