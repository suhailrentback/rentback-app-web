import Link from "next/link";
import ReceiptButton from "@/components/ReceiptButton";

export default function InvoicePage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <section className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Invoice {id}</h1>
        <ReceiptButton invoiceId={id} label="Open receipt (PDF)" />
      </div>

      <p className="text-sm opacity-70">
        This button opens <code>/api/receipts/{id}</code> in a new tab.
      </p>

      <div>
        <Link
          href="/"
          className="inline-block rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
