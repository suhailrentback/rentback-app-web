// app/admin/overdue/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import OverdueRunner from "./runner";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = "force-dynamic";

export default async function AdminOverduePage() {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });

  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Admin · Overdue</h1>
        <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">Not permitted</p>
      </div>
    );
  }

  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["staff", "admin"].includes(String(me.role))) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Admin · Overdue</h1>
        <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">Not permitted</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin · Overdue</h1>
        <Link href="/admin" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          ← Admin home
        </Link>
      </div>
      <p className="text-sm text-gray-600">
        Check how many invoices are eligible to become <strong>overdue</strong>, then run the job.
      </p>
      <OverdueRunner />
    </div>
  );
}
