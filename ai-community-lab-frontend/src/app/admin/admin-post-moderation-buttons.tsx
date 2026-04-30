"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const statusLabel: Record<"published" | "rejected" | "pending", string> = {
    published: "Post approved",
    rejected: "Post rejected",
    pending: "Post unlisted",
  };

  function run(
    next: "published" | "rejected" | "pending",
    rejectionReason?: string | null,
  ) {
    startTransition(async () => {
      const res = await adminSetPostModerationStatus(postId, next, rejectionReason);
      if (res.error) toast.error(res.error);
      else {
        toast.success(statusLabel[next]);
        setRejectOpen(false);
        setRejectNote("");
        router.refresh();
      }
    });
  }

  const s = status ?? "pending";

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto">
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
            onClick={() => setRejectOpen((o) => !o)}
            className="rounded-md border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {rejectOpen ? "Cancel reject" : "Reject"}
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
      {rejectOpen && s === "pending" ? (
        <div className="max-w-md rounded-md border border-zinc-700 bg-background p-3">
          <label htmlFor={`reject-note-${postId}`} className="text-xs text-zinc-400">
            Message to the author (optional)
          </label>
          <textarea
            id={`reject-note-${postId}`}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="What should they change before resubmitting?"
            className="mt-1 w-full rounded border border-zinc-700 bg-surface-sunken px-2 py-1.5 text-xs text-zinc-100"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => run("rejected", rejectNote)}
            className="mt-2 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-100 transition hover:bg-red-950/70 disabled:opacity-50"
          >
            {pending ? "…" : "Confirm reject"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
