"use client";

import { getOAuthRedirectBaseUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/client";
import { LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  email?: string | null;
};

export function AuthButton({ email }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function signInGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getOAuthRedirectBaseUrl()}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
  }

  async function signOut() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Signed out");
      router.refresh();
    }
  }

  if (email) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className="truncate text-sm text-zinc-400" title={email}>
          {email}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-[#1a1a1a] px-3 py-1.5 text-sm text-zinc-200 transition hover:border-[#00ff9f]/50 hover:text-[#00ff9f] disabled:opacity-50"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signInGoogle()}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00ff9f] px-4 py-2.5 text-sm font-medium text-[#0f0f0f] transition hover:bg-[#33ffa8] disabled:opacity-50"
    >
      <LogIn className="size-4" />
      {loading ? "Connecting…" : "Continue with Google"}
    </button>
  );
}
