"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminUpdateComment } from "./actions";
import { AdminDeleteButtons } from "./admin-delete-buttons";

type Props = {
  id: string;
  postId: string;
  content: string;
  children: ReactNode;
};

export function AdminCommentEditor({ id, postId, content, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = String(fd.get("content") ?? "");
    startTransition(async () => {
      const res = await adminUpdateComment(id, postId, next);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Comment updated");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex shrink-0 items-start justify-end gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-md border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-accent/45 hover:bg-zinc-800"
          >
            {open ? "Cancel" : "Edit"}
          </button>
          <AdminDeleteButtons kind="comment" id={id} postId={postId} />
        </div>
      </div>
      {open ? (
        <form onSubmit={onSubmit} className="rounded-lg border border-zinc-700 bg-background p-3">
          <textarea
            name="content"
            required
            rows={4}
            defaultValue={content}
            className="w-full rounded border border-zinc-700 bg-surface-sunken px-2 py-1.5 text-sm text-zinc-100"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save comment"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
