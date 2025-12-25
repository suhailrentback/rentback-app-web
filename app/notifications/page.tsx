// app/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  user_id: string;
  entity: string;
  entity_id: string;
  type: "INVOICE_ISSUED" | "INVOICE_PAID";
  channel: "INAPP" | "EMAIL";
  title: string | null;
  body: string | null;
  meta: any;
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  queued_at: string;
  sent_at: string | null;
  read_at: string | null;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  async function load(all = false) {
    setLoading(true);
    const res = await fetch(`/api/notifications?all=${all ? "1" : "0"}`, { cache: "no-store" });
    const json = await res.json();
    setItems(json.notifications ?? []);
    setLoading(false);
  }

  async function markRead(ids: string[]) {
    setMarking(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    await load(false);
    setMarking(false);
  }

  useEffect(() => {
    load(false);
  }, []);

  const unreadIds = items.filter(i => i.status !== "READ" && i.channel === "INAPP").map(i => i.id);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg border"
            onClick={() => load(false)}
            disabled={loading}
            title="Refresh"
          >
            Refresh
          </button>
          <button
            className="px-3 py-2 rounded-lg border"
            onClick={() => load(true)}
            disabled={loading}
            title="Show all"
          >
            Show All
          </button>
          <button
            className="px-3 py-2 rounded-lg border"
            onClick={() => markRead(unreadIds)}
            disabled={marking || unreadIds.length === 0}
            title="Mark all read"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm opacity-70">No notifications.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const isUnread = n.status !== "READ" && n.channel === "INAPP";
            return (
              <li key={n.id} className={`p-4 rounded-xl border ${isUnread ? "bg-[rgba(0,0,0,0.03)]" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-medium">
                      {n.title ?? n.type.replace("_", " ")}
                    </div>
                    <div className="text-sm opacity-80">{n.body}</div>
                    <div className="mt-1 text-xs opacity-60">
                      {new Date(n.queued_at).toLocaleString()}
                      {n.meta?.number ? ` • ${n.meta.number}` : ""}
                      {n.meta?.status ? ` • ${n.meta.status}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <button
                        className="text-xs px-2 py-1 rounded-md border"
                        onClick={() => markRead([n.id])}
                        disabled={marking}
                        title="Mark read"
                      >
                        Mark read
                      </button>
                    )}
                    <span className="text-xs rounded-md px-2 py-1 border">
                      {n.type === "INVOICE_ISSUED" ? "🧾 Issued" : n.type === "INVOICE_PAID" ? "✅ Paid" : n.type}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
