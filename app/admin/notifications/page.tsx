// app/admin/notifications/page.tsx
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_id: string;
  type: "INVOICE_ISSUED" | "INVOICE_PAID";
  title: string | null;
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  queued_at: string;
  entity: string;
  entity_id: string;
};

export default async function AdminNotificationsPage() {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("notifications")
    .select("id,user_id,type,title,status,queued_at,entity,entity_id")
    .order("queued_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl mb-4">Notifications</h1>
        <pre className="text-sm opacity-70">Error: {error.message}</pre>
      </div>
    );
  }

  const rows = (data ?? []) as Row[];

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Notifications (latest 200)</h1>
      {rows.length === 0 ? (
        <div className="text-sm opacity-70">No rows (or not permitted by RLS).</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-[900px] text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Queued At</th>
                <th className="p-3">User</th>
                <th className="p-3">Type</th>
                <th className="p-3">Title</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Status</th>
                <th className="p-3">ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-none">
                  <td className="p-3">{new Date(r.queued_at).toLocaleString()}</td>
                  <td className="p-3">{r.user_id}</td>
                  <td className="p-3">{r.type}</td>
                  <td className="p-3">{r.title}</td>
                  <td className="p-3">{r.entity}:{r.entity_id}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
