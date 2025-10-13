// ADD THIS FILE IN BOTH REPOS:
// - /components/Brand.tsx  (web)
// - /components/Brand.tsx  (admin)
//
// This component restores your original logo and supports BOTH
// default and named imports to avoid build errors.

/* eslint-disable react/jsx-no-useless-fragment */
"use client";

import Image from "next/image";
import Link from "next/link";

// IMPORTANT: We point to YOUR original file here.
// Put your original logo at: /public/rentback-logo.svg (both repos).
const LOGO_SRC = "/rentback-logo.svg";

// Adjust if your SVG/PNG has different natural size.
// (These are just display dimensions; Next will serve the static file.)
const LOGO_WIDTH = 156;
const LOGO_HEIGHT = 40;

type Props = {
  href?: string;      // default "/"
  className?: string;
  title?: string;     // accessible label
  width?: number;
  height?: number;
};

function BrandComp({
  href = "/",
  className = "",
  title = "RentBack",
  width = LOGO_WIDTH,
  height = LOGO_HEIGHT,
}: Props) {
  const logo = (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src={LOGO_SRC}
        alt={title}
        width={width}
        height={height}
        priority
      />
      {/* Wordmark is in the image; screen-readers still get a label: */}
      <span className="sr-only">{title}</span>
    </span>
  );

  return href ? (
    <Link href={href} aria-label={title} className="inline-flex items-center">
      {logo}
    </Link>
  ) : (
    <>{logo}</>
  );
}

export default BrandComp;
// Also export a named version for any `import { Brand } ...` usage.
export { BrandComp as Brand };
