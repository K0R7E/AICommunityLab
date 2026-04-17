"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { dismissNotification } from "./actions";

export function NotificationRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDismiss() {
    startTransition(async () => {
      const res = await dismissNotification(id);
      if (res.error) toast.error(res.error);
      else {
        window.dispatchEvent(new Event("acl-notifications-changed"));
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onDismiss()}
      className="rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "…" : "Dismiss"}
    </button>
  );
}
