"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { adminSetPostModerationStatus } from "./actions";

type Status = "pending" | "published" | "rejected" | string | undefined;

export function AdminPostModerationButtons({
  postId,
  status,
}: {
  postId: string;
  status: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(next: "published" | "rejected" | "pending") {
    startTransition(async () => {
      const res = await adminSetPostModerationStatus(postId, next);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Updated");
        router.refresh();
      }
    });
  }

  const s = status ?? "pending";

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-2">
      {s !== "published" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("published")}
          className="rounded-md border border-emerald-800/70 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-950/70 disabled:opacity-50"
        >
          Approve
        </button>
      ) : null}
      {s === "pending" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("rejected")}
          className="rounded-md border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
        >
          Reject
        </button>
      ) : null}
      {s === "published" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("pending")}
          className="rounded-md border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
        >
          Unlist
        </button>
      ) : null}
    </div>
  );
}
