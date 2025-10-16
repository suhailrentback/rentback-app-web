// app/tenant/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function TenantLayout({ children }: { children: ReactNode }) {
  // Server-side: check only that the user is authenticated.
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/tenant");
  }

  // ✅ No role/tenant-table check here (temporary).
  return <>{children}</>;
}
