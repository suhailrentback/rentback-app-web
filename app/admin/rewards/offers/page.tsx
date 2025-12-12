import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";

// Path of this page, used by revalidatePath
const PAGE_PATH = "/admin/rewards/offers";

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

function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // no-op for server actions; auth cookie is already present
        },
        remove() {
          // no-op
        },
      },
    }
  );
}

async function fetchOffers(): Promise<Offer[]> {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("reward_offers")
    .select("id, title, description, points_cost, is_active, stock, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Offer[];
}

// ——— Server Actions ———
export async function createOffer(formData: FormData) {
  "use server";
  const sb = getSupabaseServer();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const pointsCost = Number(formData.get("points_cost") || 0);
  const stockRaw = String(formData.get("stock") || "").trim();
  const stock = stockRaw === "" ? null : Number(stockRaw);
  const isActive = formData.get("is_active") === "on";

  if (!title || !Number.isFinite(pointsCost) || pointsCost <= 0) {
    // Silently ignore invalid; page will re-render unchanged
    revalidatePath(PAGE_PATH);
    return;
  }

  await sb.from("reward_offers").insert({
    title,
    description,
    points_cost: Math.floor(pointsCost),
    stock: stock === null || Number.isNaN(stock) ? null : Math.floor(stock),
    is_active: !!isActive,
  });

  revalidatePath(PAGE_PATH);
}

export async function toggleOffer(formData: FormData) {
  "use server";
  const sb = getSupabaseServer();
  const id = String(formData.get("id") || "");
  const current = String(formData.get("current")) === "true";
  if (!id) return;
  await sb.from("reward_offers").update({ is_active: !current }).eq("id", id);
  revalidatePath(PAGE_PATH);
}

export async function updateOffer(formData: FormData) {
  "use server";
  const sb = getSupabaseServer();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const pointsCost = Number(formData.get("points_cost") || 0);
  const stockRaw = String(formData.get("stock") || "").trim();
  const stock = stockRaw === "" ? null : Number(stockRaw);

  const patch: Partial<Offer> & { points_cost?: number } = {} as any;
  if (title) (patch as any).title = title;
  (patch as any).description = description;
  if (Number.isFinite(pointsCost) && pointsCost > 0) (patch as any).points_cost = Math.floor(pointsCost);
  (patch as any).stock = stock === null || Number.isNaN(stock) ? null : Math.floor(stock);

  await sb.from("reward_offers").update(patch).eq("id", id);
  revalidatePath(PAGE_PATH);
}

export async function deleteOffer(formData: FormData) {
  "use server";
  const sb = getSupabaseServer();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await sb.from("reward_offers").delete().eq("id", id);
  revalidatePath(PAGE_PATH);
}

export default async function AdminOffersPage() {
  const offers = await fetchOffers();

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reward Offers</h1>
      </header>

      {/* Create Offer */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-lg font-medium mb-3">Create new offer</h2>
        <form action={createOffer} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input name="title" placeholder="Title" required className="col-span-2 rounded-md border p-2" />
          <input name="description" placeholder="Description (optional)" className="col-span-2 rounded-md border p-2" />
          <input name="points_cost" placeholder="Points cost" inputMode="numeric" className="col-span-1 rounded-md border p-2" />
          <input name="stock" placeholder="Stock (blank = ∞)" inputMode="numeric" className="col-span-1 rounded-md border p-2" />
          <label className="flex items-center gap-2 col-span-2 md:col-span-6">
            <input type="checkbox" name="is_active" defaultChecked />
            <span>Active</span>
          </label>
          <div className="col-span-2 md:col-span-6">
            <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">Create</button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Cost</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Updated</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-t align-top">
                <td className="p-3">
                  <div className="font-medium">{o.title}</div>
                  <div className="text-gray-500 max-w-prose">{o.description}</div>
                </td>
                <td className="p-3">{o.points_cost}</td>
                <td className="p-3">{o.stock ?? "∞"}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${o.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {o.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">{new Date(o.updated_at || o.created_at).toLocaleString()}</td>
                <td className="p-3 space-y-2">
                  {/* Toggle */}
                  <form action={toggleOffer}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="current" value={String(o.is_active)} />
                    <button className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50">
                      {o.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>

                  {/* Update minimal fields */}
                  <form action={updateOffer} className="grid grid-cols-2 gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <input name="title" defaultValue={o.title} className="rounded-md border p-1 text-xs" />
                    <input name="points_cost" defaultValue={String(o.points_cost)} inputMode="numeric" className="rounded-md border p-1 text-xs" />
                    <input name="stock" defaultValue={o.stock == null ? "" : String(o.stock)} inputMode="numeric" className="rounded-md border p-1 text-xs" />
                    <input name="description" defaultValue={o.description ?? ""} className="col-span-2 rounded-md border p-1 text-xs" />
                    <div className="col-span-2">
                      <button className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50">Save</button>
                    </div>
                  </form>

                  {/* Delete */}
                  <form action={deleteOffer}>
                    <input type="hidden" name="id" value={o.id} />
                    <button className="rounded-md border px-3 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr>
                <td className="p-6 text-gray-500" colSpan={6}>No offers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
