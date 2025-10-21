// app/landlord/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "../../lib/supabase/server";

export default async function LandlordHome() {
  const supabase = createServerSupabase();

  // Require session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/sign-in?next=/landlord");
  }

  // Require LANDLORD role
  const { data: profile } = await supabase
    .from("Profile")
    .select("role")
    .eq("id", session!.user.id)
    .single();

  const role = (profile as any)?.role;
  if (role !== "LANDLORD") {
    redirect("/not-permitted");
  }
  <Link
  href="/landlord/invoices/new"
  className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:opacity-90"
>
  + Create invoice
</Link>

  // Placeholder content (no design changes)
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Landlord dashboard</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-300">
          Placeholder page for LANDLORD role. (UI unchanged)
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="px-5 py-3 rounded-xl font-semibold border border-neutral-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
