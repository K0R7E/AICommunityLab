import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth/auth-button";
import { SubmitToolForm } from "./submit-tool-form";

export const metadata = {
  title: "Submit a tool · AICommunityLab",
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Submit a tool</h1>
        <p className="mt-2 max-w-lg text-sm text-zinc-400">
          Sign in with Google to share a tool with the community.
        </p>
        <div className="mt-6 max-w-xs">
          <AuthButton email={null} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100">Submit a tool</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Share title, link, and a short description. You’re signed in as{" "}
        <span className="text-zinc-300">{user.email}</span>.
      </p>
      <div className="mt-8">
        <SubmitToolForm />
      </div>
    </div>
  );
}
