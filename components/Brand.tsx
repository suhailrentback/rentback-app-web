// ADD THIS FILE TO: /components/Brand.tsx  (web) AND /components/Brand.tsx (admin)

"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;          // default "/"
  className?: string;
  title?: string;         // accessible label, default "RentBack"
  width?: number;         // image width, default 132
  height?: number;        // image height, default 32
};

/**
 * Brand logo component for header and other placements.
 * Uses /public/logo.svg by default. Replace that file with your official logo anytime.
 */
function BrandComp({
  href = "/",
  className = "",
  title = "RentBack",
  width = 132,
  height = 32,
}: Props) {
  const logo = (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/logo.svg"
        alt={title}
        width={width}
        height={height}
        priority
      />
      {/* On logo-only headers we keep the wordmark inside the SVG; screen-readers get this: */}
      <span className="sr-only">{title}</span>
    </span>
  );

  // Clickable brand (link to home) by default
  return href ? (
    <Link href={href} className="inline-flex items-center" aria-label={title}>
      {logo}
    </Link>
  ) : (
    logo
  );
}

export default BrandComp;
// Named export for compatibility with any existing `import { Brand } ...` usage
export { BrandComp as Brand };
