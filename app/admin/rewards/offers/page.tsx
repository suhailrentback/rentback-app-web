// app/admin/rewards/offers/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Admin · Reward Offers — RentBack" };

type Offer = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
  stock: number | null;
  created_at: string;
  updated_at: string;
};

async function fetchOffers(): Promise<Offer[]> {
  const sb = createClient(cookies());
  const { data, error } = await sb
    .from("reward_offers")
    .select("id,title,description,points_cost,is_active,stock,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return (data as any) ?? [];
}

// ---- server actions (not exported) ----
async function createOffer(formData: FormData) {
  "use server";
  const sb = createClient(cookies());
  const title = String(formData.get("title") || "").trim().slice(0, 120);
  const description = String(formData.get("description") || "").trim().slice(0, 2000) || null;
  const points_cost = Number(formData.get("points_cost") || 0);
  const stockStr = String(formData.get("stock") || "").trim();
  const stock = stockStr === "" ? null : Number(stockStr);
  const is_active = formData.get("is_active") ? true : false;

  if (!title || !Number.isFinite(points_cost) || points_cost <= 0) {
    redirect("/admin/rewards/offers?err=invalid_input");
  }

  const { error } = await sb.from("reward_offers").insert({
    title,
    description,
    points_cost,
    stock,
    is_active,
  });

  if (error) {
    redirect("/admin/rewards/offers?err=" + encodeURIComponent(error.message.slice(0, 120)));
  }

  revalidatePath("/admin/rewards/offers");
  redirect("/admin/rewards/offers?ok=created");
}

async function toggleActive(formData: FormData) {
  "use server";
  const sb = createClient(cookies());
  const id = String(formData.get("id") || "");
  const next = String(formData.get("next") || "") === "true";
  if (!id) redirect("/admin/rewards/offers?err=missing_id");
  const { error } = await sb.from("reward_offers").update({ is_active: next }).eq("id", id);
  if (error) redirect("/admin/rewards/offers?err=" + encodeURIComponent(error.message.slice(0, 120)));
  revalidatePath("/admin/rewards/offers");
  redirect("/admin/rewards/offers?ok=updated");
}

async function deleteOffer(formData: FormData) {
  "use server";
  const sb = createClient(cookies());
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/rewards/offers?err=missing_id");
  const { error } = await sb.from("reward_offers").delete().eq("id", id);
  if (error) redirect("/admin/rewards/offers?err=" + encodeURIComponent(error.message.slice(0, 120)));
  revalidatePath("/admin/rewards/offers");
  redirect("/admin/rewards/offers?ok=deleted");
}
// ---- end actions ----

export default async function AdminRewardOffersPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
  const ok = searchParams?.ok || "";
  const err = searchParams?.err || "";
  const offers = await fetchOffers();

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reward Offers</h1>
      </header>

      {ok ? <div className="rounded border bg-green-50 dark:bg-green-900/20 p-3 text-sm">{ok}</div> : null}
      {err ? <div className="rounded border bg-red-50 dark:bg-red-900/20 p-3 text-sm">{err}</div> : null}

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Create Offer</h2>
        <form action={createOffer} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="title"
            placeholder="Title"
            required
            className="border rounded px-3 py-2"
          />
          <input
            name="points_cost"
            type="number"
            min={1}
            step={1}
            placeholder="Points cost"
            required
            className="border rounded px-3 py-2"
          />
          <input
            name="stock"
            type="number"
            min={0}
            step={1}
            placeholder="Stock (blank = unlimited)"
            className="border rounded px-3 py-2"
          />
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked />
            <span>Active</span>
          </label>
          <textarea
            name="description"
            placeholder="Description (optional)"
            className="md:col-span-2 border rounded px-3 py-2"
          />
          <div className="md:col-span-2">
            <button className="rounded border px-3 py-2">Create</button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Cost</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Updated</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 opacity-60">No offers yet.</td>
              </tr>
            )}
            {offers.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">{o.title}</td>
                <td className="p-3">{o.points_cost.toLocaleString()}</td>
                <td className="p-3">{o.stock == null ? "∞" : o.stock}</td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                    {o.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(o.updated_at || o.created_at).toLocaleString()}
                </td>
                <td className="p-3 text-right">
                  <form action={toggleActive} className="inline-block mr-2">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="next" value={(!o.is_active).toString()} />
                    <button className="border rounded px-2 py-1 text-xs">
                      {o.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                  <form action={deleteOffer} className="inline-block">
                    <input type="hidden" name="id" value={o.id} />
                    <button className="border rounded px-2 py-1 text-xs">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
