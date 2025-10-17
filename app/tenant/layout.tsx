// app/tenant/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("rb_role")?.value;
  if (role !== "tenant") redirect("/not-permitted");
  return <>{children}</>;
}
