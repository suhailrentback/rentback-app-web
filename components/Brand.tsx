// WEB: place in rentback-app-web/components/Brand.tsx
import Link from "next/link";
import React from "react";

type Props = {
  href?: string;
  className?: string;
  size?: number;     // logo size in px (icon square)
  color?: string;    // stroke color for the mark
};

// Inline brand mark (matches your reference code)
function BrandMark({ size = 22, color = "#059669" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v9h14v-9" />
    </svg>
  );
}

export default function Brand({ href, className, size = 22, color = "#059669" }: Props) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <BrandMark size={size} color={color} />
      <span className="font-bold tracking-tight">RentBack</span>
    </span>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
