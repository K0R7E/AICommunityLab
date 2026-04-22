"use client";

import { updateProfile, type UpdateProfileState } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

type Props = {
  initialUsername: string;
  initialBio: string;
  initialWebsite: string;
  initialNotifyNewTools: boolean;
  initialNotifyCommentsOnTools: boolean;
  initialNotifyModerationUpdates: boolean;
};

export function SettingsForm({
  initialUsername,
  initialBio,
  initialWebsite,
  initialNotifyNewTools,
  initialNotifyCommentsOnTools,
  initialNotifyModerationUpdates,
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
      <div className="rounded-lg border border-zinc-800 bg-[#141414] px-4 py-3">
        <p className="text-sm font-medium text-zinc-200">Notifications</p>
        <p className="mt-1 text-xs text-zinc-500">
          Choose which inbox notifications you want to receive.
        </p>
        <div className="mt-3 space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              name="notify_comments_on_tools"
              type="checkbox"
              value="on"
              defaultChecked={initialNotifyCommentsOnTools}
              className="mt-1 size-4 shrink-0 rounded border-zinc-600 bg-[#0f0f0f] text-[#00ff9f] focus:ring-[#00ff9f]/30"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-200">
                Comments on your tools
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Enabled by default. You get notified when someone comments on a
                tool you posted.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              name="notify_moderation_updates"
              type="checkbox"
              value="on"
              defaultChecked={initialNotifyModerationUpdates}
              className="mt-1 size-4 shrink-0 rounded border-zinc-600 bg-[#0f0f0f] text-[#00ff9f] focus:ring-[#00ff9f]/30"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-200">
                Moderation updates
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Enabled by default. Includes publish/reject outcomes and
                moderator actions on your comments.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              name="notify_new_tools"
              type="checkbox"
              value="on"
              defaultChecked={initialNotifyNewTools}
              className="mt-1 size-4 shrink-0 rounded border-zinc-600 bg-[#0f0f0f] text-[#00ff9f] focus:ring-[#00ff9f]/30"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-200">
                New tools in the feed
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Off by default so large communities are not flooded. When on,
                you get one notification each time a tool is published.
              </span>
            </span>
          </label>
        </div>
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
