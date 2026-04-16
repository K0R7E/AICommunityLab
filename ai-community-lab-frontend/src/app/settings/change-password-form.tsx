"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const MIN = 8;

export function ChangePasswordForm() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN) {
      toast.error(`Password must be at least ${MIN} characters.`);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setPassword("");
      setConfirm("");
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mt-10 max-w-lg space-y-4 rounded-xl border border-zinc-800 bg-[#141414] p-5"
    >
      <h2 className="text-lg font-semibold text-zinc-100">Change password</h2>
      <p className="text-xs text-zinc-500">
        For accounts that use email and password. After a reset link, set a new
        password here as well.
      </p>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-zinc-300">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={MIN}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#0f0f0f] px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-[#00ff9f]/30"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-300">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={MIN}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#0f0f0f] px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-[#00ff9f]/30"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#00ff9f] px-4 py-2 text-sm font-semibold text-[#0f0f0f] transition hover:bg-[#33ffa8] disabled:opacity-50"
      >
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
