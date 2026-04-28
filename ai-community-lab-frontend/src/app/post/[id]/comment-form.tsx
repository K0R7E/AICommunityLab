"use client";

import { addComment } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  postId: string;
  /** Signed in and post is published on the feed (moderation approved). */
  canComment: boolean;
  signedIn: boolean;
};

export function CommentForm({ postId, canComment, signedIn }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signedIn) {
      toast.error("Sign in to comment");
      return;
    }
    if (!canComment) {
      toast.error("Comments open after this tool is approved.");
      return;
    }
    startTransition(async () => {
      const res = await addComment(postId, content);
      if (res.error) toast.error(res.error);
      else {
        setContent("");
        toast.success("Comment posted");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="comment" className="text-sm font-medium text-zinc-300">
        Add a comment
      </label>
      <textarea
        id="comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={!signedIn || !canComment || pending}
        className="w-full rounded-lg border border-zinc-700 bg-surface-sunken px-3 py-2 text-zinc-100 outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
        placeholder={
          !signedIn
            ? "Sign in to comment"
            : !canComment
              ? "Available after moderator approval…"
              : "Share your experience…"
        }
      />
      <button
        type="submit"
        disabled={!signedIn || !canComment || pending || !content.trim()}
        className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
