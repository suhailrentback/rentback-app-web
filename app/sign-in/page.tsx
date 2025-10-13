// WEB: place in rentback-app-web/app/sign-in/page.tsx
import Brand from "@/components/Brand";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <Brand href="/" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Sign in</h1>
      <p className="text-sm opacity-80 mb-6">
        Magic link/OTP UI placeholder. This is a demo-only screen.
      </p>
      <div className="grid gap-3">
        <button className="px-4 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
          Continue with Email
        </button>
        <Link
          href="/"
          className="px-4 py-3 rounded-xl font-semibold border border-neutral-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-center"
        >
          Continue in Demo Mode
        </Link>
      </div>
    </div>
  );
}
