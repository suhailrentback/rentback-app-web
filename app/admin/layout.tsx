// app/admin/layout.tsx
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="fixed top-3 right-3 z-50">
        <a
          href="/sign-out"
          className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Sign out
        </a>
      </div>
      {children}
    </div>
  );
}
