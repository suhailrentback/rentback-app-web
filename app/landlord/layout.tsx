// app/landlord/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  const role = cookies().get("rb_role")?.value;
  if (role !== "landlord") redirect("/not-permitted");
  return <>{children}</>;
}
