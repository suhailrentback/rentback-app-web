'use client';

import clsx from 'clsx';

export default function AuthBrand({ className = '' }: { className?: string }) {
  return (
    <a href="/" aria-label="RentBack home" className={clsx('inline-flex items-center gap-2', className)}>
      <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-emerald-600 text-xs font-bold text-white">
        RB
      </span>
      <span className="text-base font-semibold tracking-tight">RentBack</span>
    </a>
  );
}
