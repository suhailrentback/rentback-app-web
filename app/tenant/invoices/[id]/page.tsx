import Link from "next/link";
import InvoiceDetailClient from "@/components/invoices/InvoiceDetailClient";

// Make sure the route never gets statically cached
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Link href="/tenant/invoices" className="text-sm text-blue-600 hover:underline">
        ← Back to invoices
      </Link>
      <InvoiceDetailClient id={params.id} />
    </div>
  );
}
