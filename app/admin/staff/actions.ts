// app/admin/staff/actions.ts
"use server";

import { createRouteSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Role = "tenant" | "landlord" | "staff" | "admin";
const ROLES: Role[] = ["tenant", "landlord", "staff", "admin"];

/**
 * Server Action for the staff page.
 * IMPORTANT: must return Promise<void> for <form action={...}> to typecheck.
 */
export async function setRoleAction(formData: FormData): Promise<void> {
  try {
    const supabase = createRouteSupabase();

    // Enforce requester is staff/admin
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      // Not signed in — silently no-op
      return;
    }

    const { data: me } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (!me || (me.role !== "staff" && me.role !== "admin")) {
      // Forbidden — silently no-op
      return;
    }

    const userId = String(formData.get("userId") ?? "");
    const newRole = String(formData.get("newRole") ?? "") as Role;

    if (!userId || !ROLES.includes(newRole)) {
      // Invalid input — silently no-op
      return;
    }

    // Update role
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      // Log on server, but still return void
      console.error("setRoleAction update error:", error.message);
    }
  } catch (e) {
    console.error("setRoleAction failed:", e);
  } finally {
    // Refresh the page data regardless
    revalidatePath("/admin/staff");
  }
}
