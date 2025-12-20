// components/EmptyState.tsx
import Link from "next/link";

export default function EmptyState({
  title,
  hint,
  actions,
  className,
}: {
  title: string;
  hint?: string;
  actions?: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        "rounded-2xl border border-black/10 dark:border-white/10 p-6"
      }
    >
      <div className="font-medium">{title}</div>
      {hint ? <div className="text-xs opacity-70 mt-1">{hint}</div> : null}
      {actions && actions.length ? (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {actions.map((a) => (
            <Link
              key={`${a.href}|${a.label}`}
              href={a.href}
              className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              {a.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
