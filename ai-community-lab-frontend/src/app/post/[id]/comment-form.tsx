"use client";

import { addComment } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  postId: string;
  canComment: boolean;
};

export function CommentForm({ postId, canComment }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canComment) {
      toast.error("Sign in to comment");
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
        disabled={!canComment || pending}
        className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2 disabled:opacity-50"
        placeholder={
          canComment ? "Share your experience…" : "Sign in to comment"
        }
      />
      <button
        type="submit"
        disabled={!canComment || pending || !content.trim()}
        className="self-start rounded-lg bg-[#00ff9f] px-4 py-2 text-sm font-semibold text-[#0f0f0f] transition hover:bg-[#33ffa8] disabled:opacity-50"
      >
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
