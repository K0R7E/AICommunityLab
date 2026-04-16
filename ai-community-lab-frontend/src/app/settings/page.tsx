import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/data/profile";
import { ChangePasswordForm } from "./change-password-form";
import { SettingsForm } from "./settings-form";

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

  const hasEmailPassword =
    user.identities?.some((i) => i.provider === "email") ?? false;

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
        Update how you appear on the site. Signed in as{" "}
        <span className="text-zinc-300">{user.email}</span>.
      </p>
      <div className="mt-8">
        <SettingsForm
          initialUsername={profile.username}
          initialBio={profile.bio ?? ""}
          initialWebsite={profile.website ?? ""}
        />
      </div>
      {hasEmailPassword ? <ChangePasswordForm /> : null}
    </div>
  );
}
