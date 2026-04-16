"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationsInboxLink() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications/unread", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const body = (await res.json()) as { count?: number };
        if (!cancelled) setCount(typeof body.count === "number" ? body.count : 0);
      } catch {
        if (!cancelled) setCount(0);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const showBadge = count !== null && count > 0;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex size-10 items-center justify-center rounded-lg border border-zinc-700 bg-[#1a1a1a] text-zinc-200 transition hover:border-[#00ff9f]/40"
      aria-label={showBadge ? `Notifications, ${count} unread` : "Notifications"}
    >
      <Bell className="size-5" aria-hidden />
      {showBadge ? (
        <span className="absolute -right-1 -top-1 flex min-w-[1.125rem] items-center justify-center rounded-full bg-[#00ff9f] px-1 text-[10px] font-bold leading-none text-[#0f0f0f]">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
