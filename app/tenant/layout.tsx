// app/tenant/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("rb_role")?.value || null;

  // Not signed in or no role cookie? Send to sign-in for this area.
  if (!role) redirect("/sign-in?next=/tenant");

  // Signed-in but wrong role
  if (role !== "tenant") redirect("/not-permitted");

  return <>{children}</>;
}
