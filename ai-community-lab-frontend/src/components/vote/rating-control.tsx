"use client";

import { CSRF_COOKIE_NAME } from "@/lib/csrf-constants";
import { formatRatingDisplay } from "@/lib/format";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
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

  const [inFlightCount, setInFlightCount] = useState(0);
  const [sum, setSum] = useState(initialRatingSum);
  const [count, setCount] = useState(initialRatingCount);
  const [myRating, setMyRating] = useState<number | null>(initialMyRating);
  const latestOpId = useRef(0);
  const helperTextId = useId();
  const csrfTokenRef = useRef<string | null>(null);

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

  function readCookieValue(name: string): string | null {
    if (typeof document === "undefined") return null;
    const all = document.cookie ? document.cookie.split("; ") : [];
    const pair = all.find((entry) => entry.startsWith(`${name}=`));
    if (!pair) return null;
    return decodeURIComponent(pair.slice(name.length + 1));
  }

  async function ensureCsrfToken(): Promise<string | null> {
    if (csrfTokenRef.current) return csrfTokenRef.current;

    const cookieToken = readCookieValue(CSRF_COOKIE_NAME);
    if (cookieToken) {
      csrfTokenRef.current = cookieToken;
      return cookieToken;
    }

    const response = await fetch("/api/csrf-token", {
      method: "GET",
      headers: { "x-requested-with": "XMLHttpRequest" },
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return null;

    const json = (await response.json()) as { csrfToken?: string };
    if (!json.csrfToken || typeof json.csrfToken !== "string") return null;
    csrfTokenRef.current = json.csrfToken;
    return json.csrfToken;
  }

  async function sendRatingRequest(method: "POST" | "DELETE", payload: object) {
    const csrfToken = await ensureCsrfToken();
    if (!csrfToken) return { ok: false, status: 0 };

    const response = await fetch("/api/ratings", {
      method,
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken,
        "x-requested-with": "XMLHttpRequest",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    return response;
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

      const opId = ++latestOpId.current;
      setInFlightCount((c) => c + 1);
      const response = await sendRatingRequest("DELETE", { postId });
      if (!response.ok) {
        if (opId === latestOpId.current) {
          setSum(prevSum);
          setCount(prevCount);
          setMyRating(prevMy);
          toast.error(response.status === 401 ? "Login to Vote" : "Vote update failed");
        }
        setInFlightCount((c) => Math.max(0, c - 1));
        return;
      }
      if (opId === latestOpId.current) {
        router.refresh();
      }
      setInFlightCount((c) => Math.max(0, c - 1));
      return;
    }

    applyOptimistic(next, prevMy);

    const opId = ++latestOpId.current;
    setInFlightCount((c) => c + 1);
    const response = await sendRatingRequest("POST", { postId, value: next });
    if (!response.ok) {
      if (opId === latestOpId.current) {
        setSum(prevSum);
        setCount(prevCount);
        setMyRating(prevMy);
        toast.error(response.status === 401 ? "Login to Vote" : "Vote update failed");
      }
      setInFlightCount((c) => Math.max(0, c - 1));
      return;
    }
    if (opId === latestOpId.current) {
      router.refresh();
    }
    setInFlightCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className="flex min-w-[5.75rem] flex-col items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#141414] px-1.5 py-2 sm:min-w-[6.5rem]">
      <div className="text-center leading-tight">
        <span className="text-lg font-bold tabular-nums text-[#00ff9f]">{avg}</span>
        <p className="text-[11px] text-zinc-500">{countLabel}</p>
      </div>
      <p className="text-[11px] text-zinc-500">
        {myRating === null ? "No vote yet" : `Your vote: ${myRating}/5`}
      </p>
      {canRate ? (
        <div
          className="flex flex-wrap justify-center gap-0.5"
          role="group"
          aria-label="Your rating from one to five stars"
          aria-describedby={helperTextId}
        >
          {SCALE.map((n) => {
            const active = myRating === n;
            const filled = myRating !== null && n <= myRating;
            const tooltipText = active
              ? `Remove your ${n}-star rating`
              : `Rate this tool ${n} out of 5`;
            return (
              <span key={n} className="group/rate relative inline-flex">
                <button
                  type="button"
                  onClick={() => void pickValue(n)}
                  className={`flex min-h-8 min-w-8 items-center justify-center rounded p-1 transition ${
                    active
                      ? "bg-[#00ff9f]/15 ring-1 ring-[#00ff9f]/50"
                      : "hover:bg-zinc-800/90"
                  }`}
                  aria-pressed={active}
                  aria-busy={inFlightCount > 0}
                  aria-label={tooltipText}
                >
                  <Star
                    className={`size-4 transition ${
                      filled
                        ? "fill-[#00ff9f] text-[#00ff9f]"
                        : "text-zinc-500 group-hover/rate:text-zinc-200 group-focus-within/rate:text-zinc-200"
                    }`}
                    aria-hidden
                  />
                </button>
                <span className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-100 opacity-0 shadow transition group-hover/rate:opacity-100 group-focus-within/rate:opacity-100">
                  {tooltipText}
                </span>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-[11px] text-zinc-500">Sign in to vote.</p>
      )}
      <p id={helperTextId} className="sr-only">
        {canRate
          ? "Choose from one to five stars. Press the currently selected rating again to remove your vote."
          : "Sign in to submit a rating."}
      </p>
    </div>
  );
}
