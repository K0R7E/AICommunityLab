"use client";

import { createClient } from "@/lib/supabase/client";
import { getEmailAuthRedirectOrigin } from "@/lib/email-auth-redirect";
import { safeRelativeNextPath } from "@/lib/safe-next-path";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const MIN_PASSWORD = 8;

type Mode = "signin" | "signup";

type Props = {
  nextPath?: string;
};

export function EmailAuthForm({ nextPath = "/" }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const safeNext = safeRelativeNextPath(nextPath);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim();
    if (!em || !em.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      toast.error(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setLoading(true);
    const origin = getEmailAuthRedirectOrigin();
    const confirmUrl =
      origin && `${origin}/auth/confirm?next=${encodeURIComponent(safeNext)}`;

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: em,
        password,
        options: confirmUrl ? { emailRedirectTo: confirmUrl } : undefined,
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.session) {
        toast.success("Account created — you’re signed in.");
        router.refresh();
        router.push(safeNext);
      } else {
        toast.success("Check your email to confirm your account.");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: em,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    router.refresh();
    router.push(safeNext);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#141414] p-5">
      <div className="flex gap-2 rounded-lg bg-zinc-900/80 p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            mode === "signin"
              ? "bg-[#00ff9f] text-[#0f0f0f]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            mode === "signup"
              ? "bg-[#00ff9f] text-[#0f0f0f]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="email-auth-email" className="mb-1 block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email-auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-700 bg-[#0f0f0f] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="email-auth-password" className="mb-1 block text-sm font-medium text-zinc-300">
            Password
          </label>
          <input
            id="email-auth-password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD}
            className="w-full rounded-lg border border-zinc-700 bg-[#0f0f0f] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2"
            placeholder={`At least ${MIN_PASSWORD} characters`}
          />
        </div>
        {mode === "signin" ? (
          <p className="text-center text-xs text-zinc-500">
            <a href="/login/forgot-password" className="text-[#00ff9f] hover:underline">
              Forgot password?
            </a>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-[#00ff9f]/40 hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in with email"}
        </button>
      </form>
    </div>
  );
}
