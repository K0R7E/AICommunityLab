"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminDeleteComment, adminDeletePost } from "./actions";

type Props =
  | { kind: "post"; id: string; postId: string }
  | { kind: "comment"; id: string; postId: string };

export function AdminDeleteButtons(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [commentStep, setCommentStep] = useState(false);
  const [commentNote, setCommentNote] = useState("");

  function onDeleteClick() {
    if (props.kind === "post") {
      if (!confirm("Delete this permanently?")) return;
      startTransition(async () => {
        const res = await adminDeletePost(props.id);
        if (res.error) toast.error(res.error);
        else {
          toast.success("Post deleted");
          router.refresh();
        }
      });
      return;
    }
    if (!commentStep) {
      setCommentStep(true);
      return;
    }
    if (!confirm("Delete this comment permanently?")) return;
    startTransition(async () => {
      const res = await adminDeleteComment(
        props.id,
        props.postId,
        commentNote.trim() || null,
      );
      if (res.error) toast.error(res.error);
      else {
        toast.success("Comment removed");
        setCommentStep(false);
        setCommentNote("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {props.kind === "comment" && commentStep ? (
        <div className="w-full max-w-xs rounded-md border border-zinc-700 bg-background p-2">
          <label className="text-[10px] uppercase tracking-wide text-zinc-500">
            Note to author (optional)
          </label>
          <textarea
            value={commentNote}
            onChange={(e) => setCommentNote(e.target.value)}
            rows={2}
            placeholder="Why this was removed…"
            className="mt-1 w-full rounded border border-zinc-700 bg-surface-sunken px-2 py-1 text-xs text-zinc-100"
          />
          <button
            type="button"
            className="mt-1 text-xs text-zinc-500 underline hover:text-zinc-300"
            onClick={() => {
              setCommentStep(false);
              setCommentNote("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => onDeleteClick()}
        className="shrink-0 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-950/70 disabled:opacity-50"
      >
        {pending
          ? "…"
          : props.kind === "comment" && !commentStep
            ? "Remove…"
            : props.kind === "comment" && commentStep
              ? "Confirm removal"
              : "Delete"}
      </button>
    </div>
  );
}
