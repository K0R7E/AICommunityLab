"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Reads one-shot URL params set by server redirects and converts them into
 * Sonner toasts, then cleans the param from the URL.
 *
 * Supported params:
 *   ?signed_in=1   — shown after a successful OAuth login (returning users)
 *   ?signed_out=1  — shown after sign-out
 *   ?error=auth    — shown when OAuth code exchange fails
 */
export function FlashToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const signedIn = searchParams.get("signed_in") === "1";
    const signedOut = searchParams.get("signed_out") === "1";
    const error = searchParams.get("error");

    if (!signedIn && !signedOut && error !== "auth") return;

    fired.current = true;

    if (signedIn) toast.success("Signed in successfully.");
    if (signedOut) toast.info("You have been signed out.");
    if (error === "auth") toast.error("Sign-in failed. Please try again.");

    // Remove the param without a full navigation
    const next = new URLSearchParams(searchParams.toString());
    next.delete("signed_in");
    next.delete("signed_out");
    next.delete("error");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}
