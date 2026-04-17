"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const INBOX_CHANGED = "acl-notifications-changed";

export function NotificationsInboxLink() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) return;
      const body = (await res.json()) as { count?: number };
      if (!mountedRef.current) return;
      setCount(typeof body.count === "number" ? body.count : 0);
    } catch {
      if (!mountedRef.current) return;
      setCount(0);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);

    function onInboxChanged() {
      void load();
    }

    window.addEventListener(INBOX_CHANGED, onInboxChanged);
    window.addEventListener("focus", onInboxChanged);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener(INBOX_CHANGED, onInboxChanged);
      window.removeEventListener("focus", onInboxChanged);
    };
  }, [load]);

  useEffect(() => {
    if (pathname === "/notifications") {
      const t = window.setTimeout(() => void load(), 0);
      return () => window.clearTimeout(t);
    }
  }, [pathname, load]);

  const showBadge = count !== null && count > 0;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex size-10 items-center justify-center rounded-lg border border-zinc-700 bg-[#1a1a1a] text-zinc-200 transition hover:border-[#00ff9f]/40"
      aria-label={showBadge ? `Notifications, ${count} in inbox` : "Notifications"}
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
