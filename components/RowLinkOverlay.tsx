// components/RowLinkOverlay.tsx
import Link from "next/link";

export default function RowLinkOverlay({
  href,
  label = "View invoice",
}: {
  href: string;
  label?: string;
}) {
  // Absolutely-positioned link that covers the entire table row area
  return <Link href={href} aria-label={label} className="absolute inset-0" />;
}
