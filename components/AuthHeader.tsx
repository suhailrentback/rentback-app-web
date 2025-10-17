'use client';

import AuthBrand from './AuthBrand';

export default function AuthHeader() {
  return (
    <header className="relative z-10 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <AuthBrand />
        <nav className="flex items-center gap-4 text-sm">
          <a href="/" className="text-gray-700 hover:text-emerald-700">Home</a>
          <a href="/sign-in" className="rounded-full bg-emerald-600 px-3.5 py-1.5 font-medium text-white hover:bg-emerald-700">
            Sign in
          </a>
        </nav>
      </div>
    </header>
  );
}
