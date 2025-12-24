// app/tools/overdue/page.tsx
import RunOverdueSweepButton from '@/components/RunOverdueSweepButton';

export const dynamic = 'force-dynamic';

export default function OverdueToolPage() {
  return (
    <section className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Overdue Sweep</h1>
      <p className="text-sm opacity-70">
        Marks any <b>ISSUED</b> invoice whose <code>due_at</code> is in the past as <b>OVERDUE</b>.
      </p>
      <RunOverdueSweepButton />
    </section>
  );
}
