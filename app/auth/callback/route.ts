// WEB: app/auth/callback/page.tsx
// Safe, dependency-free auth callback screen for Wave 1.1
// (We’ll add Supabase code-exchange in Wave 1.2.)

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Signing you in… | RentBack',
};

export default function AuthCallbackPage() {
  return (
    <section className="min-h-[60vh] grid place-items-center p-6">
      <div className="max-w-md text-center space-y-2">
        <h1 className="text-2xl font-bold">Signing you in…</h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm">
          This is the secure callback. You can close this window.
        </p>
      </div>
    </section>
  );
}
