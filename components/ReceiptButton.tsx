"use client";

type Props = {
  invoiceId: string;
  label?: string;
  variant?: "button" | "link";
};

export default function ReceiptButton({
  invoiceId,
  label = "View receipt (PDF)",
  variant = "button",
}: Props) {
  const href = `/api/receipts/${encodeURIComponent(invoiceId)}`;

  if (variant === "link") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:opacity-80"
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-block rounded-xl px-4 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
    >
      {label}
    </a>
  );
}
