"use client";

import { createClient } from "@/lib/supabase/client";
import { ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  postId: string;
  initialVotes: number;
  initialHasVoted: boolean;
  canVote: boolean;
};

export function VoteButton({
  postId,
  initialVotes,
  initialHasVoted,
  canVote,
}: Props) {
  const router = useRouter();
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [pending, startTransition] = useTransition();
  const supabase = createClient();

  async function toggle() {
    if (!canVote) {
      toast.error("Sign in to vote");
      return;
    }

    const prevVotes = votes;
    const prevVoted = hasVoted;
    const nextVoted = !hasVoted;
    setHasVoted(nextVoted);
    setVotes((v) => (nextVoted ? v + 1 : Math.max(0, v - 1)));

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setVotes(prevVotes);
        setHasVoted(prevVoted);
        toast.error("Sign in to vote");
        return;
      }

      if (prevVoted) {
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) {
          setVotes(prevVotes);
          setHasVoted(prevVoted);
          toast.error(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("votes").insert({
          post_id: postId,
          user_id: user.id,
        });
        if (error) {
          setVotes(prevVotes);
          setHasVoted(prevVoted);
          toast.error(error.message);
          return;
        }
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      className="group flex min-w-[3rem] flex-col items-center justify-center gap-0.5 rounded-lg border border-zinc-800 bg-[#141414] px-2 py-2 transition hover:border-[#00ff9f]/40 disabled:opacity-60"
      aria-pressed={hasVoted}
      aria-label={hasVoted ? "Remove vote" : "Upvote"}
    >
      <ChevronUp
        className={`size-6 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0 ${
          hasVoted ? "text-[#00ff9f]" : "text-zinc-500 group-hover:text-[#00ff9f]"
        }`}
      />
      <span
        className={`text-xs font-semibold tabular-nums transition-colors ${
          hasVoted ? "text-[#00ff9f]" : "text-zinc-400"
        }`}
      >
        {votes}
      </span>
    </button>
  );
}
