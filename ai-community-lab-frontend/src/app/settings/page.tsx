import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/data/profile";
import { SettingsForm } from "./settings-form";
import { DeleteAccountButton } from "./delete-account-button";

export const metadata = {
  title: "Settings · AICommunityLab",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/settings");
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Your profile is not ready yet. Apply the latest database migration
          (profiles + trigger) and refresh — or sign out and sign in again after
          migrations are applied.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Update your profile and notification preferences. Signed in as{" "}
        <span className="text-zinc-300">{user.email}</span>.
      </p>
      <div className="mt-8">
        <SettingsForm
          initialUsername={profile.username}
          initialBio={profile.bio ?? ""}
          initialWebsite={profile.website ?? ""}
          initialNotifyNewTools={Boolean(profile.notify_new_tools)}
          initialNotifyCommentsOnTools={Boolean(profile.notify_comments_on_tools ?? true)}
          initialNotifyModerationUpdates={Boolean(profile.notify_moderation_updates ?? true)}
        />
      </div>

      <div className="mt-12 border-t border-red-900/40 pt-8">
        <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Deleting your account is permanent and cannot be undone. All your
          posts, comments, and data will be removed.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
