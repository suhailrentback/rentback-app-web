// components/EmptyState.tsx
import clsx from "clsx";
import React from "react";

export default function EmptyState({
  title,
  hint,
  actions,
  className,
}: {
  title: string;
  hint?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-black/10 dark:border-white/10 p-6",
        className
      )}
    >
      <div className="font-medium">{title}</div>
      {hint ? <div className="text-xs opacity-70 mt-1">{hint}</div> : null}
      {actions ? <div className="mt-3 flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
