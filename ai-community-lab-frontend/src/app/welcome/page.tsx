import { redirect } from "next/navigation";
import { WelcomeConsent } from "@/components/auth/welcome-consent";
import { safeRelativeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Welcome · AICommunityLab",
  // No reason to index a per-user consent gate.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ProfileGateRow = {
  has_accepted_terms?: boolean | null;
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const rawNext = sp.next ?? "/";
  const nextSafe = safeRelativeNextPath(rawNext);
  // Avoid bouncing the user back through the consent gate via a manipulated
  // `?next=/welcome`. Anchor the fallback on `/`.
  const nextPath = nextSafe === "/welcome" ? "/" : nextSafe;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("has_accepted_terms")
    .eq("id", user.id)
    .maybeSingle<ProfileGateRow>();

  // If a returning user somehow lands on the gate (e.g. via direct URL),
  // bounce them straight to their destination — the gate is one-shot.
  // Re-consent on terms-version bumps is handled by a separate migration that
  // flips `has_accepted_terms` back to false for stale acceptors.
  if (profileRow?.has_accepted_terms === true) {
    redirect(nextPath);
  }

  return <WelcomeConsent nextPath={nextPath} />;
}
