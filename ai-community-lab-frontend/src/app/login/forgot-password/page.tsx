"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getEmailAuthRedirectOrigin } from "@/lib/email-auth-redirect";
import { safeRelativeNextPath } from "@/lib/safe-next-path";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim();
    if (!em) {
      toast.error("Enter your email.");
      return;
    }
    const origin = getEmailAuthRedirectOrigin();
    if (!origin) {
      toast.error("Set NEXT_PUBLIC_SITE_URL for password reset links.");
      return;
    }
    const next = safeRelativeNextPath("/settings");
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(em, {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("If an account exists, you’ll get an email shortly.");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-zinc-100">Reset password</h1>
      <p className="mt-2 text-sm text-zinc-400">
        We’ll email you a link to set a new password. The link opens this app and
        signs you in; then update your password on Settings.
      </p>
      {sent ? (
        <p className="mt-6 text-sm text-zinc-300">
          Check your inbox (and spam).{" "}
          <Link href="/login" className="text-[#00ff9f] hover:underline">
            Back to sign in
          </Link>
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 flex flex-col gap-4">
          <div>
            <label htmlFor="reset-email" className="mb-1 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#00ff9f] px-4 py-2.5 text-sm font-semibold text-[#0f0f0f] transition hover:bg-[#33ffa8] disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/login" className="text-[#00ff9f] hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
