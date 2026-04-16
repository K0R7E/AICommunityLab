"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "acl_onboarding_dismissed";

export function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    });
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#00ff9f]/25 bg-[#00ff9f]/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-zinc-200">
        <p className="font-medium text-zinc-100">Welcome to AICommunityLab</p>
        <p className="mt-1 text-zinc-400">
          Discover tools,{" "}
          <Link href="/login?next=/submit" className="text-[#00ff9f] hover:underline">
            sign in
          </Link>{" "}
          to submit and comment, and rate what you use.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="inline-flex shrink-0 items-center justify-center gap-1 self-end rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800/80 sm:self-center"
        aria-label="Dismiss welcome message"
      >
        <X className="size-3.5" aria-hidden />
        Dismiss
      </button>
    </div>
  );
}
