"use client";

import { getOAuthRedirectBaseUrl } from "@/lib/auth-redirect";
import { safeRelativeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/client";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  /** Post-login path (must be relative, e.g. `/settings`) */
  nextPath?: string;
  className?: string;
  label?: string;
};

export function SignInWithGoogle({
  nextPath = "/",
  className,
  label = "Continue with Google",
}: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function signInGoogle() {
    setLoading(true);
    const safeNext = safeRelativeNextPath(nextPath);
    const redirectTo = `${getOAuthRedirectBaseUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // Without this, Google reuses the last account in the browser — no way to pick another user.
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
  }

  return (
    <button
      type="button"
      onClick={() => void signInGoogle()}
      disabled={loading}
      className={
        className ??
        "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
      }
    >
      <LogIn className="size-4" />
      {loading ? "Connecting…" : label}
    </button>
  );
}
