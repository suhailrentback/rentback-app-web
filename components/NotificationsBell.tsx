// components/NotificationsBell.tsx
"use client";

import { useEffect, useState } from "react";

export default function NotificationsBell() {
  const [count, setCount] = useState<number>(0);

  async function refresh() {
    const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
    const json = await res.json();
    setCount(json.count ?? 0);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <a href="/notifications" className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border">
      <span aria-hidden>🔔</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black text-white">
          {count}
        </span>
      )}
    </a>
  );
}
