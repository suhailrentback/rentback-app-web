// app/security/page.tsx
export const dynamic = "force-dynamic";

export default function SecurityPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Security & Responsible Disclosure</h1>

      <p>
        We take security seriously. If you believe you’ve found a vulnerability,
        please email <a className="underline" href="mailto:security@rentback.app">security@rentback.app</a>.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Scope</h2>
        <p>
          Reports affecting RentBack apps, APIs, infrastructure, or data privacy are in scope.
          Do not exfiltrate data beyond what’s necessary to demonstrate impact.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Guidelines</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>No DDoS or traffic flooding.</li>
          <li>No impact to other users’ data or availability.</li>
          <li>Give us reasonable time to remediate before public disclosure.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">PGP</h2>
        <p>
          If you need encryption, request our current PGP key at{" "}
          <a className="underline" href="mailto:security@rentback.app">security@rentback.app</a>.
        </p>
      </section>

      <p className="text-sm text-gray-500">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>
    </main>
  );
}
