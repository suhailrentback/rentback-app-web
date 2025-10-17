// app/admin/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("rb_role")?.value;
  if (role !== "staff") redirect("/not-permitted");
  return <>{children}</>;
}
