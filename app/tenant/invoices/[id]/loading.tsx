// app/tenant/invoices/[id]/loading.tsx
export default function LoadingInvoice() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 h-4 w-64 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 h-52 w-full animate-pulse rounded-2xl bg-gray-100" />
    </div>
  );
}
