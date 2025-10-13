// PLACE THIS FILE IN BOTH REPOS:
// - web:   /components/Brand.tsx
// - admin: /components/Brand.tsx
// Renders the SVG logo + the "RentBack" wordmark exactly as written.

import React from "react";

type Props = {
  className?: string;
  size?: number; // icon height in px
};

export default function Brand({ className, size = 22 }: Props) {
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <img
        src="/rentback-logo.svg"
        alt="RentBack logo"
        width={size}
        height={size}
        className="inline-block"
      />
      <span className="text-base font-bold tracking-[-0.01em]">RentBack</span>
    </div>
  );
}
