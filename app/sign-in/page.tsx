// app/sign-in/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import { Brand } from '@/components/Brand';

export default function SignInPage() {
  // For App we’ll land tenants back on "/" for now (A-6 adds tenant/admin guards)
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#0b0b0b] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Brand />
          <nav className="flex items-center gap-2">
            <Link href="/" className="px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <AuthForm title="Sign in" subtitle="RentBack — secure access" nextPath="/" />
      </main>
    </div>
  );
}
