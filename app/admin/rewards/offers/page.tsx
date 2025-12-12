// app/admin/rewards/offers/page.tsx
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function createSb() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

async function requireStaff() {
  const sb = createSb();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: prof } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!prof || !["staff", "admin"].includes((prof as any).role)) {
    throw new Error("Not permitted");
  }
  return sb;
}

type Offer = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default async function AdminOffersPage() {
  const sb = await requireStaff();
  const { data, error } = await sb
    .from("reward_offers")
    .select("id,title,description,points_cost,is_active,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const offers = (data ?? []) as Offer[];

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Rewards — Offers</h1>

      <section className="rounded-2xl border p-4">
        <h2 className="font-medium mb-3">Create offer</h2>
        <form method="post" action="/admin/api/rewards/offers" className="grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Title" className="border rounded-xl p-2" />
          <input name="points_cost" required type="number" min={1} placeholder="Points cost" className="border rounded-xl p-2" />
          <textarea name="description" placeholder="Description" className="border rounded-xl p-2 md:col-span-2" />
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked />
            <span>Active</span>
          </label>
          <div />
          <button className="rounded-2xl border px-4 py-2">Save</button>
        </form>
      </section>

      <section className="rounded-2xl border">
        <div className="p-4 border-b">
          <h2 className="font-medium">All offers</h2>
        </div>
        <div className="divide-y">
          {offers.map((o) => (
            <div key={o.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className="md:w-1/3">
                <div className="font-medium">{o.title}</div>
                <div className="text-sm opacity-70">Cost: {o.points_cost} pts</div>
                <div className="text-xs opacity-60">{o.is_active ? "Active" : "Inactive"}</div>
              </div>

              <form method="post" action="/admin/api/rewards/offers" className="flex-1 grid gap-2 md:grid-cols-3">
                <input type="hidden" name="id" value={o.id} />
                <input name="title" defaultValue={o.title} className="border rounded-xl p-2" />
                <input name="points_cost" type="number" min={1} defaultValue={o.points_cost} className="border rounded-xl p-2" />
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="is_active" defaultChecked={o.is_active} />
                  <span>Active</span>
                </label>
                <textarea name="description" defaultValue={o.description ?? ""} className="border rounded-xl p-2 md:col-span-3" />
                <div className="flex gap-2">
                  <button className="rounded-2xl border px-3 py-2">Update</button>
                  <form method="post" action="/admin/api/rewards/offers/toggle">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="to" value={o.is_active ? "false" : "true"} />
                    <button className="rounded-2xl border px-3 py-2">{o.is_active ? "Deactivate" : "Activate"}</button>
                  </form>
                  <form method="post" action={`/admin/api/rewards/offers/${o.id}/delete`}>
                    <button className="rounded-2xl border px-3 py-2">Delete</button>
                  </form>
                </div>
              </form>
            </div>
          ))}
          {offers.length === 0 && <div className="p-4 text-sm opacity-70">No offers yet.</div>}
        </div>
      </section>
    </div>
  );
}
