"use client";

import { deleteAccount } from "@/app/actions";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onFirstClick() {
    setConfirming(true);
  }

  function onCancel() {
    setConfirming(false);
  }

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result && "error" in result) {
        toast.error(result.error);
        setConfirming(false);
      }
      // On success the server action redirects — no client cleanup needed.
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={onFirstClick}
        className="rounded-lg border border-red-800/60 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-600 hover:bg-red-950/40 hover:text-red-300"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-300">Are you sure you want to delete your account?</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPending}
        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
