import Link from "next/link";

export default function RowLinkOverlay({
  href,
  label = "View invoice",
}: {
  href: string;
  label?: string;
}) {
  return <Link href={href} aria-label={label} className="absolute inset-0" />;
}
