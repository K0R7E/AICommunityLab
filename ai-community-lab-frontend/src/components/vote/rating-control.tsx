"use client";

import { createClient } from "@/lib/supabase/client";
import { formatRatingDisplay } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const SCALE = [1, 2, 3, 4, 5] as const;

type Props = {
  postId: string;
  initialRatingSum: number;
  initialRatingCount: number;
  initialMyRating: number | null;
  canRate: boolean;
};

export function RatingControl({
  postId,
  initialRatingSum,
  initialRatingCount,
  initialMyRating,
  canRate,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const supabase = createClient();

  const [sum, setSum] = useState(initialRatingSum);
  const [count, setCount] = useState(initialRatingCount);
  const [myRating, setMyRating] = useState<number | null>(initialMyRating);

  const { avg, countLabel } = formatRatingDisplay(sum, count);

  function applyOptimistic(next: number, prevMy: number | null) {
    if (prevMy === null) {
      setSum((s) => s + next);
      setCount((c) => c + 1);
    } else {
      setSum((s) => s - prevMy + next);
    }
    setMyRating(next);
  }

  async function pickValue(next: number) {
    if (!canRate) {
      toast.error("Login to Vote");
      return;
    }

    const prevSum = sum;
    const prevCount = count;
    const prevMy = myRating;

    if (prevMy === next) {
      setSum((s) => s - next);
      setCount((c) => Math.max(0, c - 1));
      setMyRating(null);

      startTransition(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setSum(prevSum);
          setCount(prevCount);
          setMyRating(prevMy);
          toast.error("Login to Vote");
          return;
        }

        const { error } = await supabase
          .from("ratings")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) {
          setSum(prevSum);
          setCount(prevCount);
          setMyRating(prevMy);
          toast.error(error.message);
          return;
        }
        router.refresh();
      });
      return;
    }

    applyOptimistic(next, prevMy);

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSum(prevSum);
        setCount(prevCount);
        setMyRating(prevMy);
        toast.error("Login to Vote");
        return;
      }

      const { error } = await supabase.from("ratings").upsert(
        {
          post_id: postId,
          user_id: user.id,
          value: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,post_id" },
      );

      if (error) {
        setSum(prevSum);
        setCount(prevCount);
        setMyRating(prevMy);
        toast.error(error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex min-w-[6.5rem] flex-col items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#141414] px-1.5 py-2">
      <div className="text-center leading-tight">
        <span className="text-lg font-bold tabular-nums text-[#00ff9f]">{avg}</span>
        <p className="text-[10px] text-zinc-500">{countLabel}</p>
      </div>
      <div
        className="flex flex-wrap justify-center gap-0.5"
        role="group"
        aria-label="Your rating 1 to 5; press the same number again to remove your vote"
      >
        {SCALE.map((n) => {
          const active = myRating === n;
          return (
            <button
              key={n}
              type="button"
              disabled={pending}
              onClick={() => void pickValue(n)}
              className={`min-w-[1.35rem] rounded px-0.5 py-1 text-[11px] font-semibold tabular-nums transition disabled:opacity-60 ${
                active
                  ? "bg-[#00ff9f]/20 text-[#00ff9f] ring-1 ring-[#00ff9f]/50"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
              aria-pressed={active}
              aria-label={
                active ? `Remove your ${n} star rating` : `Rate ${n} out of 5`
              }
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
