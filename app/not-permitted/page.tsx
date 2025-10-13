// app/not-permitted/page.tsx
import Link from "next/link";

export default function NotPermitted() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Not permitted</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">
          You’re signed in but don’t have access to this section.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/sign-in"
            className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Go to sign in
          </Link>
          <Link
            href="/"
            className="px-5 py-3 rounded-xl font-semibold border border-neutral-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
