import Link from "next/link";

/**
 * Absolutely-positioned link that covers the entire table row area.
 * - Keyboard focusable
 * - Screen-reader label provided
 */
export default function RowLinkOverlay({
  href,
  label = "View invoice",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
    >
      {/* Keeps the link accessible even though it’s visually empty */}
      <span className="sr-only">{label}</span>
    </Link>
  );
}
