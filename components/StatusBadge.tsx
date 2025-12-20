import { notFound } from "next/navigation";

/** ---- Types ---- */
type LineItem = {
  description: string;
  qty: number;
  unit_price: number;
};

type Invoice = {
  id: string;
  number: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  issued_at: string | null;
  due_at: string | null;
  currency: string; // e.g. "USD", "PKR", "EUR"
  customer_name: string;
  customer_email?: string | null;
  billing_address?: string | null;
  notes?: string | null;
  items: LineItem[];
};

/** ---- Helpers ---- */
function money(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    // fallback if currency code is odd
    return `${currency} ${n.toFixed(2)}`;
  }
}

function calcTotals(items: LineItem[]) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.unit_price, 0);
  const tax = 0; // HTML print page keeps it neutral; your data may already include tax
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

/** ---- Data loader ----
 * Tries to fetch from Supabase if env vars exist.
 * Falls back to a demo invoice so the page always prints.
 */
async function loadInvoice(id: string): Promise<Invoice | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon) {
    try {
      // Lazy (no extra imports) call to your existing JSON detail endpoint if you have one.
      // If you don’t, this will 404 and we’ll drop to the demo.
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/invoices/${id}`, {
        // If you don’t have SITE_URL, next will still try relative, which is fine at runtime.
        // At build time this won’t run.
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const inv = (await res.json()) as Invoice;
        if (inv && inv.id) return inv;
      }
    } catch {
      // ignore and use demo
    }
  }

  // Demo (safe fallback)
  if (!id) return null;
  return {
    id,
    number: "INV-1001",
    status: "ISSUED",
    issued_at: new Date().toISOString(),
    due_at: new Date(Date.now() + 7 * 864e5).toISOString(),
    currency: "USD",
    customer_name: "Demo Tenant",
    customer_email: "tenant@example.com",
    billing_address: "123 River Road\nKarachi, PK",
    notes: "Thank you for your business.",
    items: [
      { description: "December Rent – Unit A2", qty: 1, unit_price: 1200 },
      { description: "Maintenance fee", qty: 1, unit_price: 50 },
    ],
  };
}

/** ---- Print Controls (client) ---- */
function PrintControls({ pdfHref }: { pdfHref: string }) {
  // keep this component server-safe: no 'use client' needed if we don't call window directly
  // we’ll trigger print via a query param instead.
  return (
    <div className="print:hidden flex gap-2">
      <a
        href="#print"
        className="rounded-xl px-4 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
      >
        Print
      </a>
      <a
        href={pdfHref}
        className="rounded-xl px-4 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
      >
        Download PDF
      </a>
    </div>
  );
}

/** ---- Page ---- */
export default async function PrintInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await loadInvoice(params.id);
  if (!invoice) notFound();

  const { subtotal, tax, total } = calcTotals(invoice.items);
  const pdfHref = `/api/receipts/${invoice.id}`;

  return (
    <html
      lang="en"
      className="bg-white print:bg-white"
      suppressHydrationWarning
    >
      <head>
        <title>Invoice {invoice.number} — Print</title>
        {/* Minimal print CSS on top of Tailwind */}
        <style
          // Keep it tiny; we rely mostly on Tailwind + print: variants
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                .no-print { display: none !important; }
                html, body { background: #ffffff !important; }
              }
              @page { size: A4; margin: 18mm; }
            `,
          }}
        />
        {/* Auto-print if hash is #print */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                if (typeof window !== 'undefined' && window.location.hash === '#print') {
                  setTimeout(function(){ window.print(); }, 200);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white text-black">
        {/* Toolbar (hidden in print) */}
        <div className="no-print sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-black/10">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
            <div className="font-semibold">Invoice {invoice.number}</div>
            <PrintControls pdfHref={pdfHref} />
          </div>
        </div>

        {/* Paper */}
        <main className="mx-auto max-w-3xl p-8 print:p-0">
          <div className="rounded-2xl border border-black/10 p-8 print:border-0 print:p-0">
            {/* Header */}
            <header className="flex items-start justify-between gap-6">
              <div>
                <div className="text-2xl font-bold">RentBack</div>
                <div className="text-xs opacity-70">
                  support@rentback.app · rentback.app
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold">Invoice</div>
                <div className="text-sm opacity-70">#{invoice.number}</div>
                <div className="mt-1 text-xs">
                  <div>Issued: {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : "—"}</div>
                  <div>Due: {invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : "—"}</div>
                  <div>Status: {invoice.status}</div>
                </div>
              </div>
            </header>

            {/* Bill To */}
            <section className="mt-8 grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium">Bill To</div>
                <div className="mt-1 text-sm">
                  <div className="font-semibold">{invoice.customer_name}</div>
                  {invoice.customer_email ? (
                    <div className="opacity-80">{invoice.customer_email}</div>
                  ) : null}
                  {invoice.billing_address ? (
                    <pre className="whitespace-pre-wrap text-sm opacity-80">
                      {invoice.billing_address}
                    </pre>
                  ) : null}
                </div>
              </div>
              <div className="md:text-right text-sm">
                <div className="font-medium">From</div>
                <div className="opacity-80">
                  RentBack Ltd.
                  <br />
                  123 Demo Street
                  <br />
                  Porto, PT
                </div>
              </div>
            </section>

            {/* Items */}
            <section className="mt-8 overflow-hidden rounded-xl border border-black/10 print:border-black/5">
              <table className="w-full text-sm">
                <thead className="bg-black/5">
                  <tr>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-right p-3 font-medium">Qty</th>
                    <th className="text-right p-3 font-medium">Unit</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="p-3">{it.description}</td>
                      <td className="p-3 text-right">{it.qty}</td>
                      <td className="p-3 text-right">
                        {money(it.unit_price, invoice.currency)}
                      </td>
                      <td className="p-3 text-right">
                        {money(it.qty * it.unit_price, invoice.currency)}
                      </td>
                    </tr>
                  ))}

                  {/* Totals */}
                  <tr className="border-t border-black/5">
                    <td className="p-3 font-medium" colSpan={3}>
                      Subtotal
                    </td>
                    <td className="p-3 text-right">
                      {money(subtotal, invoice.currency)}
                    </td>
                  </tr>
                  <tr className="border-t border-black/5">
                    <td className="p-3 font-medium" colSpan={3}>
                      Tax
                    </td>
                    <td className="p-3 text-right">
                      {money(tax, invoice.currency)}
                    </td>
                  </tr>
                  <tr className="border-t border-black/5">
                    <td className="p-3 font-semibold" colSpan={3}>
                      Total
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {money(total, invoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Notes */}
            {invoice.notes ? (
              <section className="mt-8">
                <div className="text-sm font-medium">Notes</div>
                <p className="text-sm opacity-80 mt-1 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </section>
            ) : null}

            {/* Footer */}
            <footer className="mt-10 text-xs opacity-70">
              This invoice was generated by RentBack.
            </footer>
          </div>
        </main>
      </body>
    </html>
  );
}

/** Ensure this route is always treated as dynamic (so printing never caches awkwardly) */
export const dynamic = "force-dynamic";
