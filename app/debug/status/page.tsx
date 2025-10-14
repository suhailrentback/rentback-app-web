// app/debug/status/page.tsx
import DebugStatusClient from '@/components/DebugStatusClient';

export const dynamic = 'force-dynamic';

export default function StatusPage() {
  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <h1 className="text-2xl font-semibold">Debug Status</h1>
      <p className="opacity-80">
        This page helps verify environment wiring, language cookie, and whether a client
        session exists. It shows no secrets.
      </p>
      <DebugStatusClient />
    </div>
  );
}
