// WEB: place in rentback-app-web/components/Brand.tsx
import Link from "next/link";
import Image from "next/image";
import React from "react";

type Props = {
  href?: string;
  className?: string;
  size?: number; // logo size in px (square)
};

export default function Brand({ href, className, size = 28 }: Props) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {/* Uses your existing public/rentback-logo.svg */}
      <Image
        src="/rentback-logo.svg"
        alt="RentBack"
        width={size}
        height={size}
        priority
      />
      <span className="font-bold tracking-tight">RentBack</span>
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
