"use client";

import { updateProfile, type UpdateProfileState } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

type Props = {
  initialUsername: string;
  initialBio: string;
  initialWebsite: string;
};

export function SettingsForm({
  initialUsername,
  initialBio,
  initialWebsite,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProfile,
    { error: null } satisfies UpdateProfileState,
  );

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.doneAt) {
      toast.success("Profile updated");
      router.refresh();
    }
  }, [state.error, state.doneAt, router]);

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-zinc-300"
        >
          Username
        </label>
        <p className="mt-1 text-xs text-zinc-500">
          3–32 characters: lowercase letters, numbers, and underscores only.
        </p>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          defaultValue={initialUsername}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-sm text-zinc-100 outline-none ring-[#00ff9f]/0 transition focus:border-[#00ff9f]/50 focus:ring-2 focus:ring-[#00ff9f]/20"
        />
      </div>
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-zinc-300">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={initialBio}
          className="mt-2 w-full resize-y rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#00ff9f]/50 focus:ring-2 focus:ring-[#00ff9f]/20"
        />
      </div>
      <div>
        <label
          htmlFor="website"
          className="block text-sm font-medium text-zinc-300"
        >
          Website
        </label>
        <input
          id="website"
          name="website"
          type="text"
          inputMode="url"
          placeholder="https://example.com"
          defaultValue={initialWebsite}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#00ff9f]/50 focus:ring-2 focus:ring-[#00ff9f]/20"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#00ff9f] px-4 py-2 text-sm font-medium text-[#0f0f0f] transition hover:bg-[#33ffa8] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
