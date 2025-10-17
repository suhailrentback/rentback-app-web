// app/not-permitted/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';

export default function NotPermitted() {
  const role = cookies().get('rb_role')?.value as 'tenant' | 'landlord' | 'staff' | undefined;
  const home =
    role === 'staff' ? '/admin' : role === 'landlord' ? '/landlord' : role === 'tenant' ? '/tenant' : '/sign-in';

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Not permitted</h1>
      <p className="mt-2 text-gray-600">You’re signed in but don’t have access to this section.</p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link href="/sign-in" className="rounded-lg border px-4 py-2 font-medium">
          Go to sign in
        </Link>
        <Link href={home} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white">
          Go to your dashboard
        </Link>
      </div>
    </div>
  );
}
