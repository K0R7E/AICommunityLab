"use client";

import { acceptTerms } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  /** Where to send the user once they accept (already sanitised). */
  nextPath: string;
};

/**
 * Mandatory first-login consent gate. Rendered as a centered modal-style card
 * over a backdrop on the dedicated `/welcome` page. The user cannot dismiss
 * this UI — it's a hard gate that only completes once `acceptTerms()` flips
 * the `has_accepted_terms` flag on their profile.
 */
export function WelcomeConsent({ nextPath }: Props) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onAccept() {
    if (!agreed || isPending) return;
    startTransition(async () => {
      const result = await acceptTerms(nextPath);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      // The server action redirects on success. As a defensive fallback (some
      // edge runtimes can swallow the redirect), force a full reload so the
      // root layout re-fetches the profile and the gate disappears.
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-surface-sunken p-6 shadow-2xl sm:p-8">
        <h1
          id="consent-title"
          className="text-xl font-semibold text-zinc-100 sm:text-2xl"
        >
          Welcome! Please accept before continuing
        </h1>

        <p id="consent-body" className="mt-4 text-sm text-zinc-300">
          To register and use this service, you must accept our{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            Terms of Service
          </Link>
          .
        </p>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-card/50 p-3 text-sm text-zinc-200 transition hover:border-accent/50">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-accent"
            aria-describedby="consent-body"
          />
          <span>
            I have read and agree to the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              Terms of Service
            </Link>
            .
          </span>
        </label>

        <button
          type="button"
          onClick={onAccept}
          disabled={!agreed || isPending}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Continue"}
        </button>

        <p className="mt-4 text-center text-xs text-zinc-500">
          You must accept to use AICommunityLab. If you do not agree, please
          sign out.
        </p>
      </div>
    </div>
  );
}
