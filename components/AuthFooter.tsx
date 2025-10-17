'use client';

import AuthBrand from './AuthBrand';

export default function AuthFooter() {
  return (
    <footer className="relative z-10 border-t bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-gray-600">
        <AuthBrand />
        <div className="flex items-center gap-4">
          <a className="hover:text-emerald-700" href="/debug/status">Status</a>
          <a className="hover:text-emerald-700" href="/api/health">Health</a>
        </div>
      </div>
    </footer>
  );
}
