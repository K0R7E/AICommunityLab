"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { markNotificationRead } from "./actions";

export function NotificationRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markRead() {
    startTransition(async () => {
      const res = await markNotificationRead(id);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => markRead()}
      className="rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "…" : "Mark read"}
    </button>
  );
}
