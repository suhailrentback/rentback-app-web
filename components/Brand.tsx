// components/Brand.tsx
'use client';

import * as React from 'react';

/** Inline SVG home/roof mark — emerald stroke by default (#059669). */
export function Logo({
  size = 22,
  stroke = '#059669',
  className,
}: {
  size?: number;
  stroke?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v9h14v-9" />
    </svg>
  );
}

/** Brand = Logo + wordmark "RentBack" (emerald-600 light / emerald-400 dark) */
export function Brand({
  size = 22,
  stroke = '#059669',
  className = '',
  textClassName = '',
}: {
  size?: number;
  stroke?: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 font-bold',
        'text-emerald-600 dark:text-emerald-400',
        className || '',
      ].join(' ')}
    >
      <Logo size={size} stroke={stroke} />
      <span className={textClassName}>RentBack</span>
    </span>
  );
}

export default Brand;
