import clsx from "clsx";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-xl bg-black/10 dark:bg-white/10",
        className
      )}
      aria-hidden="true"
    />
  );
}
