export default function Loading() {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span className="animate-pulse inline-block h-2 w-2 rounded-full bg-gray-400" />
        <span>Loading…</span>
      </div>
    </div>
  );
}
