// app/admin/staff/actions.ts
"use server";

import { createRouteSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Role = "tenant" | "landlord" | "staff" | "admin";
const ROLES: Role[] = ["tenant", "landlord", "staff", "admin"];

export async function setRoleAction(formData: FormData) {
  const supabase = createRouteSupabase();

  // Enforce requester is staff/admin
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { ok: false, error: "not_signed_in" };

  const { data: me } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!me || (me.role !== "staff" && me.role !== "admin")) {
    return { ok: false, error: "forbidden" };
  }

  const userId = String(formData.get("userId") ?? "");
  const newRole = String(formData.get("newRole") ?? "") as Role;

  if (!userId || !ROLES.includes(newRole)) {
    return { ok: false, error: "invalid_input" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/staff");
  return { ok: true };
}
